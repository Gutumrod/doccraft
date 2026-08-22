export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T; errors: [] }
  | { ok: false; errors: ValidationIssue[] };

export function valid<T>(value: T): ValidationResult<T> {
  return { ok: true, value, errors: [] };
}

export function invalid<T = never>(errors: ValidationIssue[]): ValidationResult<T> {
  return { ok: false, errors };
}

export function issue(code: string, path: string, message: string): ValidationIssue {
  return { code, path, message };
}
