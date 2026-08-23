import type { DocCraftDocument } from '../domain/document/types';
import { createPersistenceError } from './errors';
import { migratePersistedEnvelope } from './migration';
import {
  CURRENT_SCHEMA_VERSION,
  CURRENT_STORAGE_FORMAT_VERSION,
  type PersistedDocumentEnvelope,
  type PersistenceResult,
} from './types';

export const STORAGE_DRAFT_KEY = 'doccraft_current_draft_v1';

export function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Catch SecurityError when window.localStorage is blocked by browser security policy
    return null;
  }

  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    return null;
  }

  return null;
}

export function isStorageAvailable(): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;

    const testKey = '__doccraft_storage_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function saveDraft(document: DocCraftDocument): PersistenceResult<void> {
  let storage: Storage | null = null;
  try {
    storage = getStorage();
  } catch (err: unknown) {
    return {
      ok: false,
      error: createPersistenceError('STORAGE_UNAVAILABLE', 'LocalStorage property access failed due to security policy', err),
    };
  }

  if (!storage) {
    return {
      ok: false,
      error: createPersistenceError('STORAGE_UNAVAILABLE', 'LocalStorage is not available in this environment'),
    };
  }

  try {
    const envelope: PersistedDocumentEnvelope = {
      storageFormatVersion: CURRENT_STORAGE_FORMAT_VERSION,
      schemaVersion: document.schemaVersion || CURRENT_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      document,
    };

    const serialized = JSON.stringify(envelope);
    storage.setItem(STORAGE_DRAFT_KEY, serialized);
    return { ok: true, value: undefined };
  } catch (err: unknown) {
    const errObj = err as Record<string, unknown> | undefined;
    const errName = errObj?.name as string | undefined;
    const errCode = errObj?.code as number | undefined;

    const isQuota =
      errName === 'QuotaExceededError' ||
      errName === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      errCode === 22 ||
      errCode === 1014;

    if (isQuota) {
      return {
        ok: false,
        error: createPersistenceError('STORAGE_QUOTA_EXCEEDED', 'Storage quota exceeded while saving draft', err),
      };
    }

    if (errName === 'SecurityError' || errCode === 18) {
      return {
        ok: false,
        error: createPersistenceError('STORAGE_UNAVAILABLE', 'LocalStorage write blocked by security policy', err),
      };
    }

    return {
      ok: false,
      error: createPersistenceError('STORAGE_WRITE_FAILED', 'Failed to save draft to storage', err),
    };
  }
}

export function loadDraft(): PersistenceResult<DocCraftDocument | null> {
  let storage: Storage | null = null;
  try {
    storage = getStorage();
  } catch (err: unknown) {
    return {
      ok: false,
      error: createPersistenceError('STORAGE_UNAVAILABLE', 'LocalStorage property access failed due to security policy', err),
    };
  }

  if (!storage) {
    return {
      ok: false,
      error: createPersistenceError('STORAGE_UNAVAILABLE', 'LocalStorage is not available in this environment'),
    };
  }

  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_DRAFT_KEY);
  } catch (err: unknown) {
    return {
      ok: false,
      error: createPersistenceError('STORAGE_UNAVAILABLE', 'Failed to access storage', err),
    };
  }

  if (!raw) {
    return { ok: true, value: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (parseErr) {
    return {
      ok: false,
      error: createPersistenceError('CORRUPTED_PAYLOAD', 'Failed to parse stored draft JSON', parseErr),
    };
  }

  return migratePersistedEnvelope(parsed);
}

export function clearDraft(): PersistenceResult<void> {
  let storage: Storage | null = null;
  try {
    storage = getStorage();
  } catch (err: unknown) {
    return {
      ok: false,
      error: createPersistenceError('STORAGE_UNAVAILABLE', 'LocalStorage access failed', err),
    };
  }

  if (!storage) {
    return { ok: true, value: undefined };
  }

  try {
    storage.removeItem(STORAGE_DRAFT_KEY);
    return { ok: true, value: undefined };
  } catch (err: unknown) {
    return {
      ok: false,
      error: createPersistenceError('STORAGE_UNAVAILABLE', 'Failed to clear draft from storage', err),
    };
  }
}
