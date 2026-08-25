import { CURRENT_SCHEMA_VERSION, type DocCraftDocument } from '../domain/document/types';
import { createPersistenceError } from './errors';
import { CURRENT_STORAGE_FORMAT_VERSION, type PersistenceResult } from './types';
import { validateCanonicalDocument } from './validation';

const LEGACY_SCHEMA_VERSION = 1;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unsupportedSchema(version: unknown, label: string): PersistenceResult<DocCraftDocument> {
  return {
    ok: false,
    error: createPersistenceError(
      'UNSUPPORTED_SCHEMA_VERSION',
      `Unsupported ${label} schema version: ${String(version)} (supported: ${LEGACY_SCHEMA_VERSION} or ${CURRENT_SCHEMA_VERSION})`,
    ),
  };
}

function migrateDocument(
  rawDocument: Record<string, unknown>,
  envelopeSchemaVersion: number,
  label: string,
): PersistenceResult<DocCraftDocument> {
  if (rawDocument.schemaVersion !== envelopeSchemaVersion) {
    return {
      ok: false,
      error: createPersistenceError(
        'ENVELOPE_VALIDATION_FAILED',
        `Version mismatch: ${label} schemaVersion (${envelopeSchemaVersion}) does not match inner document schemaVersion (${String(rawDocument.schemaVersion)})`,
      ),
    };
  }

  if (envelopeSchemaVersion === CURRENT_SCHEMA_VERSION) {
    return validateCanonicalDocument(rawDocument);
  }

  if (envelopeSchemaVersion !== LEGACY_SCHEMA_VERSION) {
    return unsupportedSchema(envelopeSchemaVersion, label);
  }

  if (!Array.isArray(rawDocument.items)) {
    return {
      ok: false,
      error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'Legacy document items must be an array'),
    };
  }

  for (let index = 0; index < rawDocument.items.length; index += 1) {
    const item = rawDocument.items[index];
    if (isObject(item) && 'image' in item) {
      return {
        ok: false,
        error: createPersistenceError(
          'INVALID_DOCUMENT_STRUCTURE',
          `Legacy schema v1 item at index ${index} contains unsupported image data`,
        ),
      };
    }
  }
  const migratedDocument: Record<string, unknown> = {
    ...rawDocument,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    items: rawDocument.items.map((item) => (isObject(item) ? { ...item } : item)),
  };

  return validateCanonicalDocument(migratedDocument);
}

function validateEnvelopeBase(
  rawPayload: unknown,
  timestampField: 'savedAt' | 'exportedAt',
  context: 'storage' | 'backup',
): PersistenceResult<Record<string, unknown>> {
  if (!isObject(rawPayload)) {
    return {
      ok: false,
      error: createPersistenceError('CORRUPTED_PAYLOAD', `${context === 'storage' ? 'Payload' : 'Imported backup payload'} must be a valid JSON object`),
    };
  }

  if (!('storageFormatVersion' in rawPayload) || !('schemaVersion' in rawPayload) || !('document' in rawPayload)) {
    return {
      ok: false,
      error: createPersistenceError(
        'ENVELOPE_VALIDATION_FAILED',
        `${context === 'storage' ? 'Persisted storage payload' : 'Imported backup file'} is missing required envelope fields (storageFormatVersion, schemaVersion, document)`,
      ),
    };
  }

  if (typeof rawPayload[timestampField] !== 'string' || !(rawPayload[timestampField] as string).trim()) {
    return {
      ok: false,
      error: createPersistenceError(
        'ENVELOPE_VALIDATION_FAILED',
        `${context === 'storage' ? 'Persisted storage payload' : 'Imported backup file'} is missing required string field: ${timestampField}`,
      ),
    };
  }

  if (rawPayload.storageFormatVersion !== CURRENT_STORAGE_FORMAT_VERSION) {
    return {
      ok: false,
      error: createPersistenceError(
        'UNSUPPORTED_SCHEMA_VERSION',
        `Unsupported ${context} format version: ${String(rawPayload.storageFormatVersion)} (expected ${CURRENT_STORAGE_FORMAT_VERSION})`,
      ),
    };
  }

  if (typeof rawPayload.schemaVersion !== 'number') {
    return unsupportedSchema(rawPayload.schemaVersion, context) as PersistenceResult<Record<string, unknown>>;
  }

  if (!isObject(rawPayload.document)) {
    return {
      ok: false,
      error: createPersistenceError(
        'INVALID_DOCUMENT_STRUCTURE',
        `${context === 'storage' ? 'Envelope' : 'Backup'} document content is not a valid object`,
      ),
    };
  }

  return { ok: true, value: rawPayload };
}

export function migratePersistedEnvelope(rawPayload: unknown): PersistenceResult<DocCraftDocument> {
  const envelope = validateEnvelopeBase(rawPayload, 'savedAt', 'storage');
  if (!envelope.ok) return envelope;

  const schemaVersion = envelope.value.schemaVersion as number;
  if (schemaVersion !== LEGACY_SCHEMA_VERSION && schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return unsupportedSchema(schemaVersion, 'storage');
  }

  return migrateDocument(
    envelope.value.document as Record<string, unknown>,
    schemaVersion,
    'envelope',
  );
}

export function migrateExportEnvelope(rawPayload: unknown): PersistenceResult<DocCraftDocument> {
  const envelope = validateEnvelopeBase(rawPayload, 'exportedAt', 'backup');
  if (!envelope.ok) return envelope;

  if (envelope.value.app !== 'DocCraft') {
    return {
      ok: false,
      error: createPersistenceError(
        'ENVELOPE_VALIDATION_FAILED',
        "Invalid backup file: missing or invalid 'app' identifier (expected 'DocCraft')",
      ),
    };
  }

  const schemaVersion = envelope.value.schemaVersion as number;
  if (schemaVersion !== LEGACY_SCHEMA_VERSION && schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return unsupportedSchema(schemaVersion, 'backup');
  }

  return migrateDocument(
    envelope.value.document as Record<string, unknown>,
    schemaVersion,
    'backup envelope',
  );
}
