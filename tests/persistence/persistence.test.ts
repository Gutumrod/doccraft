import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateDocument } from '../../src/domain/calculation/calculate';
import { onePageQuotationFixture } from '../../src/domain/fixtures/representative-documents';
import {
  exportDocumentAsJson,
  importDocumentFromJson,
  serializeDocumentForExport,
} from '../../src/persistence/import-export';
import { migrateExportEnvelope, migratePersistedEnvelope } from '../../src/persistence/migration';
import { clearDraft, getStorage, loadDraft, saveDraft, STORAGE_DRAFT_KEY } from '../../src/persistence/storage';
import { validateCanonicalDocument } from '../../src/persistence/validation';

describe('Phase 4 — Local Persistence, Migration & Backup Unit Tests', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    vi.unstubAllGlobals();
    mockStore = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStore[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        mockStore[key] = String(val);
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStore[key];
      }),
      clear: vi.fn(() => {
        mockStore = {};
      }),
    });
  });

  describe('1. Storage Adapter & In-Progress Draft Autosave', () => {
    it('saves a valid document and restores it faithfully', () => {
      const saveRes = saveDraft(onePageQuotationFixture);
      expect(saveRes.ok).toBe(true);

      const loadRes = loadDraft();
      expect(loadRes.ok).toBe(true);
      if (loadRes.ok && loadRes.value) {
        expect(loadRes.value.id).toBe(onePageQuotationFixture.id);
        expect(loadRes.value.documentNumber).toBe(onePageQuotationFixture.documentNumber);
        expect(loadRes.value.items.length).toBe(onePageQuotationFixture.items.length);
        expect(loadRes.value.business.displayName).toBe(onePageQuotationFixture.business.displayName);

        // Verify calculation is cleanly derived post-restore
        const calcRes = calculateDocument(loadRes.value);
        expect(calcRes.ok).toBe(true);
      }
    });

    it('preserves and restores in-progress draft with empty document number', () => {
      const inProgressDraft = {
        ...onePageQuotationFixture,
        documentNumber: '', // User temporarily cleared document number in editor
      };

      const saveRes = saveDraft(inProgressDraft);
      expect(saveRes.ok).toBe(true);

      const loadRes = loadDraft();
      expect(loadRes.ok).toBe(true);
      if (loadRes.ok && loadRes.value) {
        expect(loadRes.value.documentNumber).toBe('');
        // Domain calculation marks it as invalid
        const calcRes = calculateDocument(loadRes.value);
        expect(calcRes.ok).toBe(false);
      }
    });

    it('preserves and restores in-progress draft with empty issue date', () => {
      const inProgressDraft = {
        ...onePageQuotationFixture,
        issueDate: '', // User temporarily cleared issue date in editor
      };

      const saveRes = saveDraft(inProgressDraft);
      expect(saveRes.ok).toBe(true);

      const loadRes = loadDraft();
      expect(loadRes.ok).toBe(true);
      if (loadRes.ok && loadRes.value) {
        expect(loadRes.value.issueDate).toBe('');
        // Domain calculation marks it as invalid
        const calcRes = calculateDocument(loadRes.value);
        expect(calcRes.ok).toBe(false);
      }
    });

    it('preserves and restores in-progress draft with negative quantity / domain-invalid numbers', () => {
      const inProgressDraft = {
        ...onePageQuotationFixture,
        items: onePageQuotationFixture.items.map((item, index) =>
          index === 0 ? { ...item, quantity: -5 } : item,
        ),
      };

      const saveRes = saveDraft(inProgressDraft);
      expect(saveRes.ok).toBe(true);

      const loadRes = loadDraft();
      expect(loadRes.ok).toBe(true);
      if (loadRes.ok && loadRes.value) {
        expect(loadRes.value.items[0].quantity).toBe(-5);
        // Domain calculation marks it as invalid
        const calcRes = calculateDocument(loadRes.value);
        expect(calcRes.ok).toBe(false);
      }
    });

    it('returns null when storage is empty', () => {
      const loadRes = loadDraft();
      expect(loadRes.ok).toBe(true);
      if (loadRes.ok) {
        expect(loadRes.value).toBeNull();
      }
    });

    it('clears draft from storage', () => {
      saveDraft(onePageQuotationFixture);
      expect(mockStore[STORAGE_DRAFT_KEY]).toBeDefined();

      const clearRes = clearDraft();
      expect(clearRes.ok).toBe(true);
      expect(mockStore[STORAGE_DRAFT_KEY]).toBeUndefined();
    });

    it('handles QuotaExceededError gracefully without mutating document', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(() => {
          const err = new DOMException('Storage full', 'QuotaExceededError');
          throw err;
        }),
        removeItem: vi.fn(),
      });

      const docBefore = JSON.stringify(onePageQuotationFixture);
      const saveRes = saveDraft(onePageQuotationFixture);

      expect(saveRes.ok).toBe(false);
      if (!saveRes.ok) {
        expect(saveRes.error.code).toBe('STORAGE_QUOTA_EXCEEDED');
      }
      // Verify document state was not mutated
      expect(JSON.stringify(onePageQuotationFixture)).toBe(docBefore);
    });

    it('handles SecurityError on property access gracefully returning failure result', () => {
      const windowMock = {};
      Object.defineProperty(windowMock, 'localStorage', {
        get: () => {
          const err = new DOMException('The operation is insecure', 'SecurityError');
          throw err;
        },
      });
      vi.stubGlobal('window', windowMock);

      const storage = getStorage();
      expect(storage).toBeNull();

      const saveRes = saveDraft(onePageQuotationFixture);
      expect(saveRes.ok).toBe(false);
      if (!saveRes.ok) {
        expect(saveRes.error.code).toBe('STORAGE_UNAVAILABLE');
      }
    });

    it('handles corrupted stored JSON safely without crashing', () => {
      mockStore[STORAGE_DRAFT_KEY] = '{ "corrupted": json...';

      const loadRes = loadDraft();
      expect(loadRes.ok).toBe(false);
      if (!loadRes.ok) {
        expect(loadRes.error.code).toBe('CORRUPTED_PAYLOAD');
      }
    });
  });

  describe('2. Schema Migration & Envelope Negotiation', () => {
    it('accepts valid persisted envelope with savedAt', () => {
      const envelope = {
        storageFormatVersion: 1,
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        document: onePageQuotationFixture,
      };

      const res = migratePersistedEnvelope(envelope);
      expect(res.ok).toBe(true);
    });

    it('rejects persisted envelope missing savedAt metadata', () => {
      const envelopeWithoutSavedAt = {
        storageFormatVersion: 1,
        schemaVersion: 1,
        document: onePageQuotationFixture,
      };

      const res = migratePersistedEnvelope(envelopeWithoutSavedAt);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('ENVELOPE_VALIDATION_FAILED');
        expect(res.error.message).toContain('savedAt');
      }
    });

    it('rejects export envelope missing exportedAt metadata', () => {
      const exportWithoutExportedAt = {
        app: 'DocCraft',
        storageFormatVersion: 1,
        schemaVersion: 1,
        document: onePageQuotationFixture,
      };

      const res = migrateExportEnvelope(exportWithoutExportedAt);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('ENVELOPE_VALIDATION_FAILED');
        expect(res.error.message).toContain('exportedAt');
      }
    });

    it('rejects bare document without envelope structure', () => {
      const res = migratePersistedEnvelope(onePageQuotationFixture);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('ENVELOPE_VALIDATION_FAILED');
      }
    });

    it('rejects envelope version mismatch between envelope and document', () => {
      const mismatchedEnvelope = {
        storageFormatVersion: 1,
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        document: {
          ...onePageQuotationFixture,
          schemaVersion: 2,
        },
      };

      const res = migratePersistedEnvelope(mismatchedEnvelope);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('ENVELOPE_VALIDATION_FAILED');
        expect(res.error.message).toContain('Version mismatch');
      }
    });

    it('rejects unsupported future schema versions in envelope', () => {
      const futureEnvelope = {
        storageFormatVersion: 1,
        schemaVersion: 99,
        savedAt: new Date().toISOString(),
        document: {
          ...onePageQuotationFixture,
          schemaVersion: 99,
        },
      };

      const res = migratePersistedEnvelope(futureEnvelope);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('UNSUPPORTED_SCHEMA_VERSION');
      }
    });

    it('accepts valid export envelope in migrateExportEnvelope', () => {
      const exportEnvelope = {
        app: 'DocCraft',
        storageFormatVersion: 1,
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        document: onePageQuotationFixture,
      };

      const res = migrateExportEnvelope(exportEnvelope);
      expect(res.ok).toBe(true);
    });
  });

  describe('3. Canonical Document Structure & Metadata Validation', () => {
    it('rejects canonical document missing createdAt timestamp without synthesizing', () => {
      const { createdAt, ...docWithoutCreatedAt } = onePageQuotationFixture;
      void createdAt;

      const res = validateCanonicalDocument(docWithoutCreatedAt);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('INVALID_DOCUMENT_STRUCTURE');
        expect(res.error.message).toContain('createdAt');
      }
    });

    it('rejects canonical document missing updatedAt timestamp without synthesizing', () => {
      const { updatedAt, ...docWithoutUpdatedAt } = onePageQuotationFixture;
      void updatedAt;

      const res = validateCanonicalDocument(docWithoutUpdatedAt);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('INVALID_DOCUMENT_STRUCTURE');
        expect(res.error.message).toContain('updatedAt');
      }
    });

    it('rejects non-string documentNumber', () => {
      const invalidDoc = {
        ...onePageQuotationFixture,
        documentNumber: 12345, // Wrong type
      };
      const res = validateCanonicalDocument(invalidDoc);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('INVALID_DOCUMENT_STRUCTURE');
      }
    });
  });

  describe('4. JSON Export & Import Backup Protocol', () => {
    it('serializes document to valid JSON envelope with metadata', () => {
      const jsonStr = serializeDocumentForExport(onePageQuotationFixture);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.app).toBe('DocCraft');
      expect(parsed.storageFormatVersion).toBe(1);
      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.document.id).toBe(onePageQuotationFixture.id);
    });

    it('performs round-trip export -> import cleanly for normal document', () => {
      const jsonStr = serializeDocumentForExport(onePageQuotationFixture);
      const importRes = importDocumentFromJson(jsonStr);

      expect(importRes.ok).toBe(true);
      if (importRes.ok) {
        expect(importRes.value.id).toBe(onePageQuotationFixture.id);
        expect(importRes.value.documentNumber).toBe(onePageQuotationFixture.documentNumber);
        expect(importRes.value.items.length).toBe(onePageQuotationFixture.items.length);
      }
    });

    it('allows export and import round-trip of in-progress structurally-valid document with empty documentNumber and negative numbers', () => {
      const inProgressDoc = {
        ...onePageQuotationFixture,
        documentNumber: '',
        items: onePageQuotationFixture.items.map((item, index) =>
          index === 0 ? { ...item, quantity: -2 } : item,
        ),
      };

      const jsonStr = serializeDocumentForExport(inProgressDoc);
      const importRes = importDocumentFromJson(jsonStr);

      expect(importRes.ok).toBe(true);
      if (importRes.ok) {
        expect(importRes.value.documentNumber).toBe('');
        expect(importRes.value.items[0].quantity).toBe(-2);

        // Validation error is surfaced in editor/calculation layer
        const calcRes = calculateDocument(importRes.value);
        expect(calcRes.ok).toBe(false);
      }
    });

    it('rejects backup with zero line items because editor-state invariant requires at least one item', () => {
      const invalidDoc = { ...onePageQuotationFixture, items: [] };
      const importRes = importDocumentFromJson(serializeDocumentForExport(invalidDoc));
      expect(importRes.ok).toBe(false);
      if (!importRes.ok) expect(importRes.error.code).toBe('INVALID_DOCUMENT_STRUCTURE');
    });

    it('rejects backup with duplicate line item ids', () => {
      const first = onePageQuotationFixture.items[0];
      const invalidDoc = { ...onePageQuotationFixture, items: [first, { ...first, description: 'duplicate identity row' }] };
      const importRes = importDocumentFromJson(serializeDocumentForExport(invalidDoc));
      expect(importRes.ok).toBe(false);
      if (!importRes.ok) expect(importRes.error.message).toContain('duplicates');
    });

    it('rejects backup whose WHT basis references an unknown line item id', () => {
      const invalidDoc = { ...onePageQuotationFixture, adjustments: { ...onePageQuotationFixture.adjustments, wht: { ...onePageQuotationFixture.adjustments.wht, basisLineItemIds: ['missing-line-item'] } } };
      const importRes = importDocumentFromJson(serializeDocumentForExport(invalidDoc));
      expect(importRes.ok).toBe(false);
      if (!importRes.ok) expect(importRes.error.message).toContain('unknown line item id');
    });

    it('rejects backup with duplicate WHT basis line item ids', () => {
      const itemId = onePageQuotationFixture.items[0].id;
      const invalidDoc = { ...onePageQuotationFixture, adjustments: { ...onePageQuotationFixture.adjustments, wht: { ...onePageQuotationFixture.adjustments.wht, basisLineItemIds: [itemId, itemId] } } };
      const importRes = importDocumentFromJson(serializeDocumentForExport(invalidDoc));
      expect(importRes.ok).toBe(false);
      if (!importRes.ok) expect(importRes.error.message).toContain('duplicate line item id');
    });

    it('rejects bare document without export envelope', () => {
      const bareDocJson = JSON.stringify(onePageQuotationFixture);
      const importRes = importDocumentFromJson(bareDocJson);

      expect(importRes.ok).toBe(false);
      if (!importRes.ok) {
        expect(importRes.error.code).toBe('ENVELOPE_VALIDATION_FAILED');
      }
    });

    it('rejects malformed JSON strings during import', () => {
      const importRes = importDocumentFromJson('{"broken json}');
      expect(importRes.ok).toBe(false);
      if (!importRes.ok) {
        expect(importRes.error.code).toBe('CORRUPTED_PAYLOAD');
      }
    });

    it('rejects import with invalid document structure (e.g. wrong field types)', () => {
      const invalidPayload = {
        app: 'DocCraft',
        schemaVersion: 1,
        storageFormatVersion: 1,
        exportedAt: new Date().toISOString(),
        document: {
          ...onePageQuotationFixture,
          documentType: 'invalid_type_name',
        },
      };

      const importRes = importDocumentFromJson(JSON.stringify(invalidPayload));
      expect(importRes.ok).toBe(false);
      if (!importRes.ok) {
        expect(importRes.error.code).toBe('INVALID_DOCUMENT_STRUCTURE');
      }
    });

    it('exportDocumentAsJson returns false safely when window/DOM is unavailable', () => {
      vi.stubGlobal('window', undefined);
      const success = exportDocumentAsJson(onePageQuotationFixture);
      expect(success).toBe(false);
    });
  });
});
