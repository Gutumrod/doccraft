import { CURRENT_SCHEMA_VERSION, type DocCraftDocument } from '../domain/document/types';
import { createPersistenceError } from './errors';
import { CURRENT_STORAGE_FORMAT_VERSION, type PersistenceResult } from './types';
import { validateCanonicalDocument } from './validation';

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

/**
 * Validates and migrates stored local persistence draft envelopes.
 * Rejects bare document objects, missing savedAt timestamps, and version inconsistencies.
 */
export function migratePersistedEnvelope(rawPayload: unknown): PersistenceResult<DocCraftDocument> {
  if (!isObject(rawPayload)) {
    return {
      ok: false,
      error: createPersistenceError('CORRUPTED_PAYLOAD', 'Payload must be a valid JSON object'),
    };
  }

  // Reject bare document objects: persisted state must have envelope structure
  if (!('storageFormatVersion' in rawPayload) || !('schemaVersion' in rawPayload) || !('document' in rawPayload)) {
    return {
      ok: false,
      error: createPersistenceError(
        'ENVELOPE_VALIDATION_FAILED',
        'Persisted storage payload is missing required envelope fields (storageFormatVersion, schemaVersion, document)'
      ),
    };
  }

  // Validate savedAt timestamp
  if (typeof rawPayload.savedAt !== 'string' || !rawPayload.savedAt.trim()) {
    return {
      ok: false,
      error: createPersistenceError(
        'ENVELOPE_VALIDATION_FAILED',
        'Persisted storage payload is missing required string field: savedAt'
      ),
    };
  }

  const formatVer = rawPayload.storageFormatVersion;
  if (typeof formatVer !== 'number' || formatVer !== CURRENT_STORAGE_FORMAT_VERSION) {
    return {
      ok: false,
      error: createPersistenceError(
        'UNSUPPORTED_SCHEMA_VERSION',
        `Unsupported storage format version: ${String(formatVer)} (expected ${CURRENT_STORAGE_FORMAT_VERSION})`
      ),
    };
  }

  const envSchemaVer = rawPayload.schemaVersion;
  if (typeof envSchemaVer !== 'number' || envSchemaVer !== CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: createPersistenceError(
        'UNSUPPORTED_SCHEMA_VERSION',
        `Unsupported envelope schema version: ${String(envSchemaVer)} (expected ${CURRENT_SCHEMA_VERSION})`
      ),
    };
  }

  const docObj = rawPayload.document;
  if (!isObject(docObj)) {
    return {
      ok: false,
      error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'Envelope document content is not a valid object'),
    };
  }

  // Check version consistency between envelope and inner document
  if (docObj.schemaVersion !== envSchemaVer) {
    return {
      ok: false,
      error: createPersistenceError(
        'ENVELOPE_VALIDATION_FAILED',
        `Version mismatch: envelope schemaVersion (${envSchemaVer}) does not match inner document schemaVersion (${String(docObj.schemaVersion)})`
      ),
    };
  }

  // Perform full structural validation
  return validateCanonicalDocument(docObj);
}

/**
 * Validates and migrates imported JSON backup files.
 * Rejects bare document objects, missing exportedAt timestamps, and untrusted version inconsistencies.
 */
export function migrateExportEnvelope(rawPayload: unknown): PersistenceResult<DocCraftDocument> {
  if (!isObject(rawPayload)) {
    return {
      ok: false,
      error: createPersistenceError('CORRUPTED_PAYLOAD', 'Imported backup payload must be a valid JSON object'),
    };
  }

  // Enforce export envelope contract
  if (rawPayload.app !== 'DocCraft') {
    return {
      ok: false,
      error: createPersistenceError(
        'ENVELOPE_VALIDATION_FAILED',
        "Invalid backup file: missing or invalid 'app' identifier (expected 'DocCraft')"
      ),
    };
  }

  if (!('storageFormatVersion' in rawPayload) || !('schemaVersion' in rawPayload) || !('document' in rawPayload)) {
    return {
      ok: false,
      error: createPersistenceError(
        'ENVELOPE_VALIDATION_FAILED',
        'Imported backup file is missing required envelope fields (storageFormatVersion, schemaVersion, document)'
      ),
    };
  }

  // Validate exportedAt timestamp
  if (typeof rawPayload.exportedAt !== 'string' || !rawPayload.exportedAt.trim()) {
    return {
      ok: false,
      error: createPersistenceError(
        'ENVELOPE_VALIDATION_FAILED',
        'Imported backup file is missing required string field: exportedAt'
      ),
    };
  }

  const formatVer = rawPayload.storageFormatVersion;
  if (typeof formatVer !== 'number' || formatVer !== CURRENT_STORAGE_FORMAT_VERSION) {
    return {
      ok: false,
      error: createPersistenceError(
        'UNSUPPORTED_SCHEMA_VERSION',
        `Unsupported backup format version: ${String(formatVer)} (expected ${CURRENT_STORAGE_FORMAT_VERSION})`
      ),
    };
  }

  const envSchemaVer = rawPayload.schemaVersion;
  if (typeof envSchemaVer !== 'number' || envSchemaVer !== CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: createPersistenceError(
        'UNSUPPORTED_SCHEMA_VERSION',
        `Unsupported backup schema version: ${String(envSchemaVer)} (expected ${CURRENT_SCHEMA_VERSION})`
      ),
    };
  }

  const docObj = rawPayload.document;
  if (!isObject(docObj)) {
    return {
      ok: false,
      error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'Backup document content is not a valid object'),
    };
  }

  // Check version consistency between envelope and inner document
  if (docObj.schemaVersion !== envSchemaVer) {
    return {
      ok: false,
      error: createPersistenceError(
        'ENVELOPE_VALIDATION_FAILED',
        `Version mismatch: backup envelope schemaVersion (${envSchemaVer}) does not match inner document schemaVersion (${String(docObj.schemaVersion)})`
      ),
    };
  }

  // Perform full structural validation
  return validateCanonicalDocument(docObj);
}
