import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BusinessLogo, DocCraftDocument } from '../../src/domain/document/types';
import { CURRENT_SCHEMA_VERSION } from '../../src/domain/document/types';
import { onePageQuotationFixture } from '../../src/domain/fixtures/representative-documents';
import {
  BUSINESS_LOGO_MAX_ATTEMPTS,
  BUSINESS_LOGO_MAX_DATA_URL_BYTES,
  BUSINESS_LOGO_MAX_LONG_EDGE,
  processBusinessLogoFile,
  validateBusinessLogoStructure,
} from '../../src/image/business-logo';
import { importDocumentFromJson, serializeDocumentForExport } from '../../src/persistence/import-export';
import { migratePersistedEnvelope } from '../../src/persistence/migration';
import { loadDraft, saveDraft } from '../../src/persistence/storage';
import { validateCanonicalDocument } from '../../src/persistence/validation';
import { setBlockVisibility, updateBusinessLogo } from '../../src/ui/editor/editor-state';

const VALID_LOGO: BusinessLogo = {
  dataUrl: 'data:image/webp;base64,AA==',
  mimeType: 'image/webp',
  width: 64,
  height: 32,
};

const VALID_JPEG_LOGO: BusinessLogo = {
  dataUrl: 'data:image/jpeg;base64,AA==',
  mimeType: 'image/jpeg',
  width: 32,
  height: 32,
};

function documentWithLogo(options?: { logo?: BusinessLogo; businessLogo?: boolean }): DocCraftDocument {
  return {
    ...onePageQuotationFixture,
    branding: {
      logo: options?.logo ?? VALID_LOGO,
    },
    blocks: {
      ...onePageQuotationFixture.blocks,
      businessLogo: options?.businessLogo ?? true,
    },
  };
}

function legacyV2DocumentWithoutLogo() {
  const legacy = JSON.parse(JSON.stringify(onePageQuotationFixture)) as Record<string, unknown> & {
    blocks: Record<string, unknown>;
    items: Array<Record<string, unknown>>;
  };
  legacy.schemaVersion = 2;
  delete legacy.branding;
  delete legacy.blocks.businessLogo;
  return legacy;
}

function installStorage() {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  });
  return store;
}

function installLogoRuntime(options?: {
  width?: number;
  height?: number;
  webpSupported?: boolean;
  oversize?: boolean;
  decodeFailure?: boolean;
}) {
  const close = vi.fn();
  const drawImage = vi.fn();
  const fillRect = vi.fn();
  const decode = vi.fn(async () => {
    if (options?.decodeFailure) {
      throw new Error('decode failed');
    }
    return {
      width: options?.width ?? 1024,
      height: options?.height ?? 512,
      close,
    };
  });
  vi.stubGlobal('createImageBitmap', decode);

  const toDataURL = vi.fn((type: string) => {
    if (options?.oversize) {
      return `data:image/webp;base64,${'A'.repeat(BUSINESS_LOGO_MAX_DATA_URL_BYTES)}`;
    }
    if (type === 'image/webp' && options?.webpSupported !== false) {
      return 'data:image/webp;base64,AA==';
    }
    if (type === 'image/webp') return 'data:image/png;base64,AA==';
    return 'data:image/jpeg;base64,AA==';
  });

  vi.stubGlobal('document', {
    createElement: vi.fn(() => ({
      width: 0,
      height: 0,
      getContext: () => ({ fillStyle: '', fillRect, drawImage }),
      toDataURL,
    })),
  });

  return { close, decode, drawImage, fillRect, toDataURL };
}

function sourceFile(type: string, contents = Uint8Array.of(1, 2, 3)) {
  return new File([contents], 'logo.fixture', { type });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Phase 4.1 business logo validation and processing', () => {
  it('accepts valid JPEG and WebP logo data URLs', () => {
    expect(validateBusinessLogoStructure(VALID_JPEG_LOGO)).toEqual({ ok: true, value: VALID_JPEG_LOGO });
    expect(validateBusinessLogoStructure(VALID_LOGO)).toEqual({ ok: true, value: VALID_LOGO });
  });

  it('rejects unsupported MIME types and mismatched data URL prefixes', () => {
    expect(validateBusinessLogoStructure({ ...VALID_LOGO, mimeType: 'image/png' }).ok).toBe(false);
    expect(validateBusinessLogoStructure({ ...VALID_LOGO, dataUrl: 'data:image/jpeg;base64,AA==' }).ok).toBe(false);
  });

  it('rejects non-strict base64 payloads', () => {
    expect(validateBusinessLogoStructure({ ...VALID_LOGO, dataUrl: 'data:image/webp;base64,A===' }).ok).toBe(false);
    expect(validateBusinessLogoStructure({ ...VALID_LOGO, dataUrl: 'data:image/webp;base64,AA' }).ok).toBe(false);
  });

  it('rejects non-positive dimensions and dimensions above 512px', () => {
    expect(validateBusinessLogoStructure({ ...VALID_LOGO, width: 0 }).ok).toBe(false);
    expect(validateBusinessLogoStructure({ ...VALID_LOGO, height: -1 }).ok).toBe(false);
    expect(validateBusinessLogoStructure({ ...VALID_LOGO, width: BUSINESS_LOGO_MAX_LONG_EDGE + 1 }).ok).toBe(false);
    expect(validateBusinessLogoStructure({ ...VALID_LOGO, height: BUSINESS_LOGO_MAX_LONG_EDGE + 1 }).ok).toBe(false);
  });

  it('rejects logo data URLs above the exact UTF-8 byte guard', () => {
    const oversized = `data:image/webp;base64,${'A'.repeat(BUSINESS_LOGO_MAX_DATA_URL_BYTES)}`;
    expect(validateBusinessLogoStructure({ ...VALID_LOGO, dataUrl: oversized }).ok).toBe(false);
  });

  it.each(['image/jpeg', 'image/png', 'image/webp'])('processes supported source type %s into a bounded canonical logo', async (type) => {
    const runtime = installLogoRuntime({ width: 1200, height: 600 });
    const logo = await processBusinessLogoFile(sourceFile(type));
    expect(logo.mimeType).toBe('image/webp');
    expect(logo.width).toBe(512);
    expect(logo.height).toBe(256);
    expect(validateBusinessLogoStructure(logo).ok).toBe(true);
    expect(runtime.toDataURL).toHaveBeenCalledTimes(1);
    expect(runtime.close).toHaveBeenCalledTimes(1);
  });

  it('uses JPEG fallback when WebP encoding is unavailable', async () => {
    const runtime = installLogoRuntime({ width: 100, height: 50, webpSupported: false });
    const logo = await processBusinessLogoFile(sourceFile('image/png'));
    expect(logo.mimeType).toBe('image/jpeg');
    expect(runtime.fillRect).toHaveBeenCalled();
    expect(runtime.drawImage).toHaveBeenCalled();
  });

  it('rejects unsupported, decode-failed, and oversize replacements without touching an accepted logo', async () => {
    const accepted = documentWithLogo();
    const before = structuredClone(accepted);

    const unsupportedRuntime = installLogoRuntime();
    await expect(processBusinessLogoFile(sourceFile('text/plain'))).rejects.toMatchObject({ code: 'UNSUPPORTED_TYPE' });
    expect(unsupportedRuntime.decode).not.toHaveBeenCalled();

    const decodeRuntime = installLogoRuntime({ decodeFailure: true });
    await expect(processBusinessLogoFile(sourceFile('image/png'))).rejects.toMatchObject({ code: 'DECODE_FAILED' });
    expect(decodeRuntime.decode).toHaveBeenCalled();

    const oversizeRuntime = installLogoRuntime({ oversize: true });
    await expect(processBusinessLogoFile(sourceFile('image/jpeg'))).rejects.toMatchObject({ code: 'TOO_LARGE' });
    expect(oversizeRuntime.toDataURL).toHaveBeenCalledTimes(BUSINESS_LOGO_MAX_ATTEMPTS);

    expect(accepted).toEqual(before);
  });
});

describe('Phase 4.1 business logo migration, persistence, and editor semantics', () => {
  it('migrates schema-v2 documents without logo fields through to canonical v4 defaults', () => {
    const legacy = legacyV2DocumentWithoutLogo();
    const result = migratePersistedEnvelope({
      storageFormatVersion: 1,
      schemaVersion: 2,
      savedAt: '2026-09-06T00:00:00.000Z',
      document: legacy,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.value.branding).toEqual({});
      expect(result.value.blocks.businessLogo).toBe(true);
      expect(result.value.id).toBe(onePageQuotationFixture.id);
      expect(result.value.createdAt).toBe(onePageQuotationFixture.createdAt);
      expect(result.value.updatedAt).toBe(onePageQuotationFixture.updatedAt);
      expect(result.value.items.map((item) => item.id)).toEqual(onePageQuotationFixture.items.map((item) => item.id));
      expect(validateCanonicalDocument(result.value).ok).toBe(true);
    }
  });

  it('round-trips accepted logo and visibility through draft restore and JSON backup import', () => {
    installStorage();
    const document = documentWithLogo({ businessLogo: false });
    expect(saveDraft(document).ok).toBe(true);

    const loaded = loadDraft();
    expect(loaded.ok).toBe(true);
    if (loaded.ok && loaded.value) {
      expect(loaded.value.branding.logo).toEqual(VALID_LOGO);
      expect(loaded.value.blocks.businessLogo).toBe(false);
    }

    const imported = importDocumentFromJson(serializeDocumentForExport(document));
    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.value.branding.logo).toEqual(VALID_LOGO);
      expect(imported.value.blocks.businessLogo).toBe(false);
    }
  });

  it('rejects imported documents with corrupted logo payloads before producing replacement document state', () => {
    const current = documentWithLogo();
    const envelope = JSON.parse(serializeDocumentForExport(documentWithLogo())) as Record<string, unknown> & {
      document: Record<string, unknown> & { branding: Record<string, unknown> };
    };
    envelope.document.branding.logo = {
      ...VALID_LOGO,
      dataUrl: 'data:image/webp;base64,not strict base64',
    };

    const result = importDocumentFromJson(JSON.stringify(envelope));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_DOCUMENT_STRUCTURE');
    expect(current.branding.logo).toEqual(VALID_LOGO);
  });

  it('clears only branding.logo when updateBusinessLogo receives undefined', () => {
    const document = documentWithLogo({ businessLogo: false });
    const cleared = updateBusinessLogo(document, undefined);
    expect(cleared.branding).toEqual({});
    expect(cleared.blocks).toEqual(document.blocks);
    expect(cleared.business).toEqual(document.business);
    expect(cleared.items).toEqual(document.items);
  });

  it('hide/show businessLogo preserves accepted logo data', () => {
    let document = documentWithLogo();
    document = setBlockVisibility(document, 'businessLogo', false);
    expect(document.blocks.businessLogo).toBe(false);
    expect(document.branding.logo).toEqual(VALID_LOGO);
    document = setBlockVisibility(document, 'businessLogo', true);
    expect(document.blocks.businessLogo).toBe(true);
    expect(document.branding.logo).toEqual(VALID_LOGO);
  });
});
