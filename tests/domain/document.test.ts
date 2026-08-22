import { describe, expect, it } from 'vitest';
import { DOCUMENT_TYPES } from '../../src/domain/document/types';
import { CURRENT_SCHEMA_VERSION, validateDocumentSchema } from '../../src/domain/document/schema';
import { makeDocument } from './helpers';

describe('document domain schema', () => {
  it.each(DOCUMENT_TYPES)('accepts supported document type %s', (documentType) => {
    const document = makeDocument();
    document.documentType = documentType;

    const result = validateDocumentSchema(document);

    expect(result.ok).toBe(true);
  });

  it('requires the current schema version', () => {
    const document = makeDocument();
    document.schemaVersion = CURRENT_SCHEMA_VERSION + 1;

    const result = validateDocumentSchema(document);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((error) => error.code)).toContain('unsupported_schema_version');
  });

  it('rejects zero quantity while allowing zero unit price', () => {
    const zeroQuantity = makeDocument();
    zeroQuantity.items[0].quantity = 0;
    const freeItem = makeDocument();
    freeItem.items[0].unitPrice = 0;

    expect(validateDocumentSchema(zeroQuantity).ok).toBe(false);
    expect(validateDocumentSchema(freeItem).ok).toBe(true);
  });
});

describe('document numeric validation', () => {
  it('accepts decimal quantity and price', () => {
    const document = makeDocument();
    document.items[0].quantity = 1.25;
    document.items[0].unitPrice = 99.95;

    expect(validateDocumentSchema(document).ok).toBe(true);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])('rejects invalid unit price %s', (value) => {
    const document = makeDocument();
    document.items[0].unitPrice = value;

    const result = validateDocumentSchema(document);

    expect(result.ok).toBe(false);
  });

  it('rejects duplicate line item ids', () => {
    const document = makeDocument();
    document.items.push({ ...document.items[0] });

    const result = validateDocumentSchema(document);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((error) => error.code)).toContain('duplicate_line_item_id');
  });
});

