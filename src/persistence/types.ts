import { CURRENT_SCHEMA_VERSION, type DocCraftDocument } from '../domain/document/types';

export { CURRENT_SCHEMA_VERSION };
export const CURRENT_STORAGE_FORMAT_VERSION = 1;

export interface PersistedDocumentEnvelope {
  storageFormatVersion: number;
  schemaVersion: number;
  savedAt: string;
  document: DocCraftDocument;
}

export interface ExportDocumentEnvelope {
  storageFormatVersion: number;
  schemaVersion: number;
  exportedAt: string;
  app: 'DocCraft';
  document: DocCraftDocument;
}

export type StorageStatus = 'idle' | 'saved' | 'saving' | 'error';

export type PersistenceErrorCode =
  | 'STORAGE_UNAVAILABLE'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'STORAGE_WRITE_FAILED'
  | 'CORRUPTED_PAYLOAD'
  | 'UNSUPPORTED_SCHEMA_VERSION'
  | 'INVALID_DOCUMENT_STRUCTURE'
  | 'ENVELOPE_VALIDATION_FAILED'
  | 'DOMAIN_VALIDATION_FAILED'
  | 'FILE_READ_ERROR';

export interface PersistenceError {
  code: PersistenceErrorCode;
  message: string;
  details?: unknown;
}

export type PersistenceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: PersistenceError };
