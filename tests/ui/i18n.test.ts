import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as unknown;
const leaves = (value: unknown, prefix = ''): Array<[string, unknown]> => {
  if (Array.isArray(value)) return [[prefix, value]];
  if (!value || typeof value !== 'object') return [[prefix, value]];
  return Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
};
const collectTsx = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name);
  return statSync(full).isDirectory() ? collectTsx(full) : name.endsWith('.tsx') ? [full] : [];
});

describe('DocCraft i18n contract', () => {
  it('has identical non-empty keys in Thai and English', () => {
    const th = leaves(readJson('messages/th.json')).sort(([a], [b]) => a.localeCompare(b));
    const en = leaves(readJson('messages/en.json')).sort(([a], [b]) => a.localeCompare(b));
    expect(en.map(([key]) => key)).toEqual(th.map(([key]) => key));
    for (const [key, value] of [...th, ...en]) expect(value, `${key} must not be empty`).not.toBe('');
  });

  it('keeps Thai UI copy out of the English catalogue', () => {
    const english = leaves(readJson('messages/en.json'));
    const thaiValues = english.filter(([, value]) => typeof value === 'string' && /[\u0E00-\u0E7F]/.test(value));
    expect(thaiValues).toEqual([]);
  });

  it('keeps hard-coded Thai out of editor UI while preserving generated document templates', () => {
    const paths = [
      'src/ui/editor/DocCraftEditor.tsx',
      'src/ui/editor/PilotNotice.tsx',
      'src/ui/editor/BlockVisibilityControls.tsx',
      ...collectTsx('src/ui/editor/sections'),
    ];
    const findings = paths.flatMap((path) => readFileSync(path, 'utf8').split(/\r?\n/)
      .flatMap((line, index) => /[\u0E00-\u0E7F]/.test(line) ? [`${path}:${index + 1}: ${line.trim()}`] : []));
    expect(findings).toEqual([]);

    const preview = readFileSync('src/ui/preview/DocumentPreview.tsx', 'utf8');
    expect(preview).toContain('data-document-output="true"');
    expect(preview).toContain('t(document.documentType)');
    expect(preview).toContain("t('docNumber')");
    const th = readJson('messages/th.json') as { documentOutput: { docNumber: string; quotation: string } };
    const en = readJson('messages/en.json') as { documentOutput: { docNumber: string; quotation: string } };
    expect(th.documentOutput.docNumber).toBe('เลขที่ / No:');
    expect(en.documentOutput.docNumber).toBe('No.:');
    expect(th.documentOutput.quotation).toBe('ใบเสนอราคา');
    expect(en.documentOutput.quotation).toBe('QUOTATION');
    const fixture = readFileSync('src/ui/editor/create-initial-document.ts', 'utf8');
    expect(fixture).toContain('[กรอกชื่อกิจการ / ผู้ประกอบการ]');
  });
});
