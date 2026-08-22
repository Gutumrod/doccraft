'use client';

import React from 'react';
import { DOCUMENT_TYPES, type DocumentType, type DocCraftDocument } from '../../../domain/document/types';
import { checkTaxInvoiceEligibility } from '../editor-state';

interface DocumentSectionProps {
  document: DocCraftDocument;
  onSelectDocumentType: (type: DocumentType) => void;
  onUpdateHeader: (patch: Partial<Pick<DocCraftDocument, 'documentNumber' | 'issueDate' | 'dueDate'>>) => void;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, { th: string; en: string }> = {
  quotation: { th: 'ใบเสนอราคา', en: 'Quotation' },
  invoice: { th: 'ใบแจ้งหนี้', en: 'Invoice' },
  receipt: { th: 'ใบเสร็จรับเงิน', en: 'Receipt' },
  work_order: { th: 'ใบสั่งงาน / ใบงาน', en: 'Work Order' },
  tax_invoice: { th: 'ใบกำกับภาษี', en: 'Tax Invoice' },
};

export function DocumentSection({ document, onSelectDocumentType, onUpdateHeader }: DocumentSectionProps) {
  const taxEligibility = checkTaxInvoiceEligibility(document);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <h2 className="mb-4 text-base font-semibold text-slate-900">1. ข้อมูลหัวเอกสาร (Document Header)</h2>

      {/* Document Type Selector */}
      <div className="mb-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
          ประเภทเอกสาร
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {DOCUMENT_TYPES.map((type) => {
            const isSelected = document.documentType === type;
            const isTaxInvoice = type === 'tax_invoice';
            const isLocked = isTaxInvoice && !taxEligibility.isEligible;

            return (
              <button
                key={type}
                type="button"
                data-testid={`doc-type-${type}`}
                disabled={isLocked}
                onClick={() => {
                  if (!isLocked) {
                    onSelectDocumentType(type);
                  }
                }}
                className={`relative flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-600/20'
                    : isLocked
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100/70 text-slate-400 opacity-60'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
                title={isLocked ? `ยังไม่สามารถออกใบกำกับภาษีได้:\n- ${taxEligibility.reasons.join('\n- ')}` : undefined}
              >
                {isLocked && (
                  <span className="absolute top-1.5 right-1.5 text-[11px] text-amber-600" title="ต้องจด VAT">
                    🔒
                  </span>
                )}
                <span className="text-xs font-bold">{DOCUMENT_TYPE_LABELS[type].th}</span>
                <span className="text-[10px] text-slate-500">{DOCUMENT_TYPE_LABELS[type].en}</span>
              </button>
            );
          })}
        </div>

        {!taxEligibility.isEligible && (
          <div className="mt-2 rounded-lg bg-amber-50/80 p-2.5 text-xs text-amber-800 border border-amber-200/60 flex items-start gap-2">
            <span className="text-sm leading-none">⚠️</span>
            <div>
              <span className="font-semibold">เงื่อนไขใบกำกับภาษี: </span>
              {taxEligibility.reasons.join(', ')} (กรุณากรอกและตั้งค่าในหมวดข้อมูลผู้ประกอบการ)
            </div>
          </div>
        )}
      </div>

      {/* Header Fields: Document Number, Issue Date, Due Date */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="docNumber" className="mb-1 block text-xs font-medium text-slate-700">
            เลขที่เอกสาร <span className="text-red-500">*</span>
          </label>
          <input
            id="docNumber"
            data-testid="input-doc-number"
            type="text"
            value={document.documentNumber}
            onChange={(e) => onUpdateHeader({ documentNumber: e.target.value })}
            placeholder="QT-2026-0001"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="issueDate" className="mb-1 block text-xs font-medium text-slate-700">
            วันที่ออกเอกสาร <span className="text-red-500">*</span>
          </label>
          <input
            id="issueDate"
            data-testid="input-issue-date"
            type="date"
            value={document.issueDate}
            onChange={(e) => onUpdateHeader({ issueDate: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="dueDate" className="mb-1 block text-xs font-medium text-slate-700">
            ครบกำหนดชำระ / ใช้ได้ถึง
          </label>
          <input
            id="dueDate"
            data-testid="input-due-date"
            type="date"
            value={document.dueDate || ''}
            onChange={(e) => onUpdateHeader({ dueDate: e.target.value || undefined })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
