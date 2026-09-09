import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateDocument } from '../../src/domain/calculation/calculate';
import type { ItemImage } from '../../src/domain/document/types';
import { CURRENT_SCHEMA_VERSION } from '../../src/domain/document/types';
import { onePageQuotationFixture } from '../../src/domain/fixtures/representative-documents';
import {
  ITEM_IMAGE_MAX_ATTEMPTS,
  ITEM_IMAGE_MAX_DATA_URL_BYTES,
  ITEM_IMAGE_MAX_LONG_EDGE,
  ITEM_IMAGE_MAX_SOURCE_BYTES,
  processItemImageFile,
  validateItemImageStructure,
} from '../../src/image/item-image';
import { importDocumentFromJson, serializeDocumentForExport } from '../../src/persistence/import-export';
import { migrateExportEnvelope, migratePersistedEnvelope } from '../../src/persistence/migration';
import { loadDraft, saveDraft } from '../../src/persistence/storage';
import { validateCanonicalDocument } from '../../src/persistence/validation';
import { addLineItem, setBlockVisibility, updateLineItem } from '../../src/ui/editor/editor-state';

const VALID_IMAGE: ItemImage = {
  dataUrl: 'data:image/jpeg;base64,AA==',
  mimeType: 'image/jpeg',
  width: 4,
  height: 4,
};

function documentWithImage(image: unknown = VALID_IMAGE) {
  return {
    ...onePageQuotationFixture,
    items: onePageQuotationFixture.items.map((item, index) =>
      index === 0 ? { ...item, image } : { ...item },
    ),
  };
}

function legacyV1Document() {
  const legacy = JSON.parse(JSON.stringify(onePageQuotationFixture)) as {
    schemaVersion: number;
    items: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  legacy.schemaVersion = 1;
  legacy.items = legacy.items.map((item) => {
    const { image: removedImage, ...rest } = item;
    void removedImage;
    return rest;
  });
  return legacy;
}

function installStorage(options?: { quota?: boolean }) {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      if (options?.quota) {
        const error = new Error('full');
        error.name = 'QuotaExceededError';
        throw error;
      }
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => delete store[key]),
  });
  return store;
}

function installImageRuntime(options?: {
  width?: number;
  height?: number;
  webpSupported?: boolean;
  oversize?: boolean;
}) {
  const close = vi.fn();
  const drawImage = vi.fn();
  const fillRect = vi.fn();
  const decode = vi.fn(async () => ({
    width: options?.width ?? 1920,
    height: options?.height ?? 960,
    close,
  }));
  vi.stubGlobal('createImageBitmap', decode);

  const toDataURL = vi.fn((type: string) => {
    if (options?.oversize) {
      return `data:image/webp;base64,${'A'.repeat(ITEM_IMAGE_MAX_DATA_URL_BYTES)}`;
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

function sourceBytes(type: string, width = 100, height = 100) {
  if (type === 'image/png') {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    bytes.set([0x49, 0x48, 0x44, 0x52], 12);
    const view = new DataView(bytes.buffer);
    view.setUint32(16, width);
    view.setUint32(20, height);
    return bytes;
  }
  if (type === 'image/jpeg') {
    return Uint8Array.from([0xff,0xd8,0xff,0xc0,0x00,0x11,0x08,(height>>8)&0xff,height&0xff,(width>>8)&0xff,width&0xff,0x03,0x01,0x11,0x00,0x02,0x11,0x00,0x03,0x11,0x00,0xff,0xd9]);
  }
  if (type === 'image/webp') {
    const bytes = new Uint8Array(30);
    bytes.set([...Buffer.from('RIFF'), 22, 0, 0, 0, ...Buffer.from('WEBPVP8X'), 10, 0, 0, 0], 0);
    const w = width - 1, h = height - 1;
    bytes.set([w & 0xff, (w >> 8) & 0xff, (w >> 16) & 0xff], 24);
    bytes.set([h & 0xff, (h >> 8) & 0xff, (h >> 16) & 0xff], 27);
    return bytes;
  }
  return Uint8Array.of(1, 2, 3);
}

function sourceFile(type: string) {
  const bytes = Uint8Array.from(sourceBytes(type));
  return new File([bytes.buffer], 'fixture.bin', { type });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Phase 4 remediation — canonical image persistence', () => {
  it('accepts the current canonical schema v4', () => {
    expect(onePageQuotationFixture.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(validateCanonicalDocument(onePageQuotationFixture).ok).toBe(true);
  });

  it('migrates a real v1 persisted draft to v4 and preserves identity/timestamps', () => {
    const legacy = legacyV1Document();
    const result = migratePersistedEnvelope({
      storageFormatVersion: 1,
      schemaVersion: 1,
      savedAt: '2026-08-24T00:00:00.000Z',
      document: legacy,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.value.id).toBe(onePageQuotationFixture.id);
      expect(result.value.createdAt).toBe(onePageQuotationFixture.createdAt);
      expect(result.value.updatedAt).toBe(onePageQuotationFixture.updatedAt);
      expect(result.value.items.map((item) => item.id)).toEqual(onePageQuotationFixture.items.map((item) => item.id));
      expect(result.value.items.every((item) => item.image === undefined)).toBe(true);
    }
  });

  it('migrates a real v1 exported backup to v4', () => {
    const result = migrateExportEnvelope({
      app: 'DocCraft',
      storageFormatVersion: 1,
      schemaVersion: 1,
      exportedAt: '2026-08-24T00:00:00.000Z',
      document: legacyV1Document(),
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('rejects future schema and envelope/document version mismatch', () => {
    const future = migratePersistedEnvelope({
      storageFormatVersion: 1,
      schemaVersion: 99,
      savedAt: '2026-08-24T00:00:00.000Z',
      document: { ...onePageQuotationFixture, schemaVersion: 99 },
    });
    expect(future.ok).toBe(false);

    const mismatch = migratePersistedEnvelope({
      storageFormatVersion: 1,
      schemaVersion: 1,
      savedAt: '2026-08-24T00:00:00.000Z',
      document: onePageQuotationFixture,
    });
    expect(mismatch.ok).toBe(false);
  });

  it('rejects image injection into a v1 payload', () => {
    const legacy = legacyV1Document();
    legacy.items[0].image = VALID_IMAGE;
    const result = migratePersistedEnvelope({
      storageFormatVersion: 1,
      schemaVersion: 1,
      savedAt: '2026-08-24T00:00:00.000Z',
      document: legacy,
    });
    expect(result.ok).toBe(false);
  });

  it('accepts valid persisted ItemImage and rejects unsupported extra fields', () => {
    expect(validateCanonicalDocument(documentWithImage()).ok).toBe(true);
    expect(validateCanonicalDocument(documentWithImage({ ...VALID_IMAGE, extra: true })).ok).toBe(false);
  });

  it('rejects MIME mismatch and invalid base64', () => {
    expect(validateCanonicalDocument(documentWithImage({ ...VALID_IMAGE, dataUrl: 'data:image/webp;base64,AA==' })).ok).toBe(false);
    expect(validateCanonicalDocument(documentWithImage({ ...VALID_IMAGE, dataUrl: 'data:image/jpeg;base64,***=' })).ok).toBe(false);
  });

  it('rejects external/blob/SVG/HTML image payload forms', () => {
    for (const dataUrl of [
      'https://example.com/a.jpg',
      'blob:https://example.com/123',
      'data:image/svg+xml;base64,AA==',
      'data:text/html;base64,AA==',
    ]) {
      expect(validateCanonicalDocument(documentWithImage({ ...VALID_IMAGE, dataUrl })).ok).toBe(false);
    }
  });

  it('rejects dimensions above 960 and non-positive dimensions', () => {
    expect(validateCanonicalDocument(documentWithImage({ ...VALID_IMAGE, width: ITEM_IMAGE_MAX_LONG_EDGE + 1 })).ok).toBe(false);
    expect(validateCanonicalDocument(documentWithImage({ ...VALID_IMAGE, width: 0 })).ok).toBe(false);
    expect(validateCanonicalDocument(documentWithImage({ ...VALID_IMAGE, height: -1 })).ok).toBe(false);
  });

  it('rejects persisted dataUrl above the exact UTF-8 byte guard', () => {
    const oversized = `data:image/jpeg;base64,${'A'.repeat(ITEM_IMAGE_MAX_DATA_URL_BYTES)}`;
    expect(validateCanonicalDocument(documentWithImage({ ...VALID_IMAGE, dataUrl: oversized })).ok).toBe(false);
  });

  it('round-trips an image through saveDraft -> loadDraft', () => {
    installStorage();
    const document = documentWithImage() as typeof onePageQuotationFixture;
    expect(saveDraft(document).ok).toBe(true);
    const loaded = loadDraft();
    expect(loaded.ok).toBe(true);
    if (loaded.ok && loaded.value) expect(loaded.value.items[0].image).toEqual(VALID_IMAGE);
  });

  it('round-trips an image through JSON export -> import', () => {
    const document = documentWithImage() as typeof onePageQuotationFixture;
    const imported = importDocumentFromJson(serializeDocumentForExport(document));
    expect(imported.ok).toBe(true);
    if (imported.ok) expect(imported.value.items[0].image).toEqual(VALID_IMAGE);
  });

  it('quota failure does not mutate the document or accepted image', () => {
    installStorage({ quota: true });
    const document = documentWithImage() as typeof onePageQuotationFixture;
    const before = structuredClone(document);
    const result = saveDraft(document);
    expect(result.ok).toBe(false);
    expect(document).toEqual(before);
  });

  it('hide/show itemImages preserves canonical image data', () => {
    let document = documentWithImage() as typeof onePageQuotationFixture;
    document = setBlockVisibility(document, 'itemImages', false);
    expect(document.items[0].image).toEqual(VALID_IMAGE);
    document = setBlockVisibility(document, 'itemImages', true);
    expect(document.items[0].image).toEqual(VALID_IMAGE);
  });

  it('remove image changes only the targeted line item', () => {
    let document = documentWithImage() as typeof onePageQuotationFixture;
    document = addLineItem(document, { description: 'Second', quantity: 1, unitPrice: 1, image: VALID_IMAGE });
    const secondId = document.items[document.items.length - 1].id;
    document = updateLineItem(document, document.items[0].id, { image: undefined });
    expect(document.items[0].image).toBeUndefined();
    expect(document.items.find((item) => item.id === secondId)?.image).toEqual(VALID_IMAGE);
  });

  it('failed replacement processing leaves an existing image/document unchanged', async () => {
    const document = documentWithImage() as typeof onePageQuotationFixture;
    const before = structuredClone(document);
    await expect(processItemImageFile(sourceFile('text/plain'))).rejects.toMatchObject({ code: 'UNSUPPORTED_TYPE' });
    expect(document).toEqual(before);
  });

  it('calculation output is unchanged by image metadata/data', () => {
    const withoutImage = calculateDocument(onePageQuotationFixture);
    const withImage = calculateDocument(documentWithImage() as typeof onePageQuotationFixture);
    expect(withImage).toEqual(withoutImage);
  });
});

describe('Phase 4 remediation — client image processing', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('accepts supported source type %s', async (type) => {
    const runtime = installImageRuntime();
    const image = await processItemImageFile(sourceFile(type));
    expect(image.mimeType).toBe('image/webp');
    expect(image.width).toBe(960);
    expect(image.height).toBe(480);
    expect(validateItemImageStructure(image).ok).toBe(true);
    expect(runtime.toDataURL).toHaveBeenCalledTimes(1);
  });

  it('rejects unsupported type before decode/document mutation', async () => {
    const runtime = installImageRuntime();
    await expect(processItemImageFile(sourceFile('image/gif'))).rejects.toMatchObject({ code: 'UNSUPPORTED_TYPE' });
    expect(runtime.decode).not.toHaveBeenCalled();
  });

  it('rejects oversized source files before browser image decoding', async () => {
    const runtime = installImageRuntime();
    const oversizedFile = { type: 'image/jpeg', size: ITEM_IMAGE_MAX_SOURCE_BYTES + 1 } as File;
    await expect(processItemImageFile(oversizedFile)).rejects.toMatchObject({ code: 'SOURCE_TOO_LARGE' });
    expect(runtime.decode).not.toHaveBeenCalled();
  });

  it('uses JPEG fallback and composites a white background when WebP is unavailable', async () => {
    const runtime = installImageRuntime({ width: 100, height: 50, webpSupported: false });
    const image = await processItemImageFile(sourceFile('image/png'));
    expect(image.mimeType).toBe('image/jpeg');
    expect(runtime.fillRect).toHaveBeenCalled();
    expect(runtime.drawImage).toHaveBeenCalled();
  });

  it('bounds oversized output to four attempts then fails safely', async () => {
    const runtime = installImageRuntime({ width: 960, height: 960, oversize: true });
    await expect(processItemImageFile(sourceFile('image/jpeg'))).rejects.toMatchObject({ code: 'TOO_LARGE' });
    expect(runtime.toDataURL).toHaveBeenCalledTimes(ITEM_IMAGE_MAX_ATTEMPTS);
    expect(runtime.close).toHaveBeenCalledTimes(1);
  });
});
