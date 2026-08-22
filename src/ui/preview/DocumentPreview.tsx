'use client';

import React from 'react';
import type { CalculationTotals } from '../../domain/calculation/types';
import type { DocCraftDocument, DocumentType } from '../../domain/document/types';
import type { ValidationIssue } from '../../domain/validation/result';

interface DocumentPreviewProps {
  document: DocCraftDocument;
  totals?: CalculationTotals;
  errors?: ValidationIssue[];
}

const DOCUMENT_TITLES: Record<DocumentType, { th: string; en: string }> = {
  quotation: { th: 'ใบเสนอราคา', en: 'QUOTATION' },
  invoice: { th: 'ใบแจ้งหนี้', en: 'INVOICE' },
  receipt: { th: 'ใบเสร็จรับเงิน', en: 'RECEIPT' },
  work_order: { th: 'ใบสั่งงาน / ใบงาน', en: 'WORK ORDER' },
  tax_invoice: { th: 'ใบกำกับภาษี', en: 'TAX INVOICE' },
};

export function DocumentPreview({ document, totals, errors }: DocumentPreviewProps) {
  const { blocks, business, customer, items } = document;
  const lineMap = new Map(totals?.lines.map((l) => [l.id, l]));

  return (
    <div
      data-testid="document-preview-container"
      className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all text-slate-800"
    >
      {/* Validation alert in preview if any errors */}
      {errors && errors.length > 0 && (
        <div data-testid="preview-validation-errors" className="mb-6 rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-900">
          <div className="flex items-center gap-2 font-bold text-rose-800 mb-1">
            <span>⚠️</span> พบข้อผิดพลาดของข้อมูลในเอกสาร ({errors.length} รายการ):
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-rose-700">
            {errors.map((err, i) => (
              <li key={i}>{err.message} <span className="text-[10px] text-rose-500 font-mono">({err.path})</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* Header Block */}
      <div className="mb-8 flex flex-col justify-between gap-6 border-b border-slate-100 pb-6 sm:flex-row sm:items-start">
        {/* Business Info Block */}
        {blocks.business ? (
          <div data-testid="preview-block-business" className="space-y-1.5 max-w-sm">
            <h1 className="text-xl font-bold tracking-tight text-slate-950">
              {business.displayName || '(ยังไม่ระบุชื่อผู้ออกเอกสาร)'}
            </h1>
            <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600">
              {business.address || '(ยังไม่ระบุที่อยู่)'}
            </p>
            {(business.taxId || business.branchType) && (
              <div className="pt-1 text-[11px] text-slate-500">
                {business.taxId && <span>เลขประจำตัวผู้เสียภาษี: <span className="font-mono">{business.taxId}</span></span>}
                {business.branchType && (
                  <span className="ml-2">
                    ({business.branchType === 'head_office' ? 'สำนักงานใหญ่' : `สาขา ${business.branchNumber || ''}`})
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">[ซ่อนข้อมูลผู้ออกเอกสาร]</div>
        )}

        {/* Document Meta Block */}
        <div className="text-left sm:text-right">
          <div className="inline-block rounded-lg bg-indigo-50/80 px-3.5 py-1.5 text-indigo-900 border border-indigo-100">
            <span className="block text-base font-extrabold tracking-wide">
              {DOCUMENT_TITLES[document.documentType].th}
            </span>
            <span className="block text-[10px] font-semibold tracking-wider text-indigo-600 uppercase">
              {DOCUMENT_TITLES[document.documentType].en}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <div className="flex justify-between sm:justify-end gap-3">
              <span className="text-slate-400">เลขที่ / No:</span>
              <span className="font-mono font-bold text-slate-900" data-testid="preview-doc-number">{document.documentNumber}</span>
            </div>
            <div className="flex justify-between sm:justify-end gap-3">
              <span className="text-slate-400">วันที่ / Date:</span>
              <span className="font-mono text-slate-900">{document.issueDate}</span>
            </div>
            {document.dueDate && (
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="text-slate-400">ครบกำหนด / Due:</span>
                <span className="font-mono text-slate-900">{document.dueDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Info Block */}
      {blocks.customer && (
        <div data-testid="preview-block-customer" className="mb-8 rounded-xl bg-slate-50/70 p-4 border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            ลูกค้า / ผู้ว่าจ้าง (Customer / Billed To)
          </span>
          <div className="text-sm font-bold text-slate-900">
            {customer.displayName || '(ยังไม่ระบุชื่อลูกค้า)'}
          </div>
          <div className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">
            {customer.address || '(ยังไม่ระบุที่อยู่)'}
          </div>
          {(customer.taxId || customer.branchType) && (
            <div className="mt-2 text-[11px] text-slate-500">
              {customer.taxId && <span>เลขประจำตัวผู้เสียภาษี: <span className="font-mono">{customer.taxId}</span></span>}
              {customer.branchType && (
                <span className="ml-2">
                  ({customer.branchType === 'head_office' ? 'สำนักงานใหญ่' : `สาขา ${customer.branchNumber || ''}`})
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Items Table Block */}
      {blocks.items && (
        <div data-testid="preview-block-items" className="mb-8 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                <th className="py-2.5 pr-2 w-10 text-center">#</th>
                <th className="py-2.5 px-2">รายการสินค้า / บริการ (Description)</th>
                <th className="py-2.5 px-2 text-right w-20">จำนวน</th>
                <th className="py-2.5 px-2 text-right w-24">ราคา/หน่วย</th>
                <th className="py-2.5 px-2 text-right w-20">ส่วนลด</th>
                <th className="py-2.5 pl-2 text-right w-28">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const calcLine = lineMap.get(item.id);
                const discountText =
                  item.discount.mode === 'none'
                    ? '-'
                    : item.discount.mode === 'percent'
                      ? `${item.discount.value}%`
                      : `${item.discount.value.toLocaleString('th-TH', { minimumFractionDigits: 2 })}฿`;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 pr-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <div className="font-medium text-slate-900">{item.description}</div>
                      {blocks.itemImages && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span>🖼️ [รูปภาพประกอบ]</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-700">{item.quantity}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-700">
                      {item.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-500">{discountText}</td>
                    <td className="py-3 pl-2 text-right font-mono font-semibold text-slate-900">
                      {calcLine
                        ? calcLine.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjustments & Totals Summary Block */}
      {blocks.adjustments && totals && (
        <div data-testid="preview-block-adjustments" className="mb-8 flex flex-col sm:flex-row justify-end">
          <div className="w-full sm:w-80 space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>รวมเป็นเงิน (Subtotal):</span>
              <span className="font-mono font-medium">{totals.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
            </div>

            {totals.documentDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>ส่วนลดท้ายเอกสาร:</span>
                <span className="font-mono">-{totals.documentDiscountAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
              </div>
            )}

            {totals.documentDiscountAmount > 0 && (
              <div className="flex justify-between text-slate-600 border-t border-slate-200/60 pt-1">
                <span>ยอดหลังหักส่วนลด:</span>
                <span className="font-mono">{totals.amountAfterDiscount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
              </div>
            )}

            {totals.vatAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                <span className="font-mono">+{totals.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
              </div>
            )}

            {totals.whtAmount > 0 && (
              <div className="flex justify-between text-amber-800">
                <span>หักภาษี ณ ที่จ่าย ({totals.whtRatePercent}%):</span>
                <span className="font-mono">-{totals.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
              </div>
            )}

            <div className="border-t-2 border-slate-300 pt-2 flex justify-between text-sm font-bold text-slate-950">
              <span>ยอดชำระสุทธิ (Net Total):</span>
              <span className="font-mono text-indigo-700">{totals.netPayable.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
            </div>

            {totals.depositAmount > 0 && (
              <div className="flex justify-between text-slate-600 border-t border-dashed border-slate-200 pt-1.5">
                <span>เงินมัดจำ (Deposit):</span>
                <span className="font-mono font-medium text-indigo-900">
                  {totals.depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Block */}
      {blocks.payment && document.payment.instructions && (
        <div data-testid="preview-block-payment" className="mb-8 rounded-xl bg-slate-50/60 p-4 border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            ข้อมูลการชำระเงิน (Payment Details)
          </span>
          <p className="whitespace-pre-line text-xs text-slate-700 leading-relaxed font-mono">
            {document.payment.instructions}
          </p>
        </div>
      )}

      {/* Terms & Notes */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {blocks.terms && document.terms && (
          <div data-testid="preview-block-terms" className="rounded-xl border border-slate-100 p-3.5 bg-slate-50/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              เงื่อนไขและข้อตกลง (Terms & Conditions)
            </span>
            <p className="whitespace-pre-line text-xs text-slate-600 leading-relaxed">
              {document.terms}
            </p>
          </div>
        )}

        {blocks.notes && document.notes && (
          <div data-testid="preview-block-notes" className="rounded-xl border border-slate-100 p-3.5 bg-slate-50/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              หมายเหตุ (Notes)
            </span>
            <p className="whitespace-pre-line text-xs text-slate-600 leading-relaxed">
              {document.notes}
            </p>
          </div>
        )}
      </div>

      {/* Signatures Block */}
      {blocks.signatures && (
        <div data-testid="preview-block-signatures" className="mt-8 border-t border-slate-100 pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
          <div>
            <div className="mx-auto mb-2 h-16 w-48 border-b border-dashed border-slate-300"></div>
            <p className="font-semibold text-slate-800">ผู้สั่งซื้อ / ผู้ว่าจ้าง</p>
            <p className="text-[10px] text-slate-400">วันที่: ____ / ____ / ________</p>
          </div>
          <div>
            <div className="mx-auto mb-2 h-16 w-48 border-b border-dashed border-slate-300"></div>
            <p className="font-semibold text-slate-800">ผู้ออกเอกสาร / ผู้มีอำนาจลงนาม</p>
            <p className="text-[10px] text-slate-400">วันที่: ____ / ____ / ________</p>
          </div>
        </div>
      )}
    </div>
  );
}
