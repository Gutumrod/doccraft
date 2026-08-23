import { CURRENT_SCHEMA_VERSION, type DocCraftDocument } from '../domain/document/types';
import { createPersistenceError } from './errors';
import { migrateExportEnvelope } from './migration';
import {
  CURRENT_STORAGE_FORMAT_VERSION,
  type ExportDocumentEnvelope,
  type PersistenceResult,
} from './types';

export function serializeDocumentForExport(document: DocCraftDocument): string {
  const envelope: ExportDocumentEnvelope = {
    app: 'DocCraft',
    storageFormatVersion: CURRENT_STORAGE_FORMAT_VERSION,
    schemaVersion: document.schemaVersion || CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    document,
  };

  return JSON.stringify(envelope, null, 2);
}

export function exportDocumentAsJson(document: DocCraftDocument): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const jsonString = serializeDocumentForExport(document);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const docNum = (document.documentNumber || 'draft').replace(/[/\\?%*:|"<>]/g, '-');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `doccraft-${docNum}-${dateStr}.json`;

    const link = window.document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    window.document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    return true;
  } catch {
    return false;
  }
}

export function importDocumentFromJson(jsonString: string): PersistenceResult<DocCraftDocument> {
  if (!jsonString || typeof jsonString !== 'string') {
    return {
      ok: false,
      error: createPersistenceError('CORRUPTED_PAYLOAD', 'Import payload is empty or not a string'),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (parseErr) {
    return {
      ok: false,
      error: createPersistenceError('CORRUPTED_PAYLOAD', 'Malformed JSON format', parseErr),
    };
  }

  return migrateExportEnvelope(parsed);
}
