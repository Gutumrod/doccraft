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
      className="a4-document-sheet rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 md:p-10 shadow-sm transition-all text-slate-900 font-sans text-xs leading-normal"
    >
      {/* Validation alert in preview (screen only, hidden in print) */}
      {errors && errors.length > 0 && (
        <div
          data-testid="preview-validation-errors"
          className="no-print mb-6 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-900"
        >
          <div className="flex items-center gap-2 font-bold text-rose-800 mb-1">
            <span>⚠️</span> พบข้อผิดพลาดของข้อมูลในเอกสาร ({errors.length} รายการ):
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-rose-700">
            {errors.map((err, i) => (
              <li key={i}>
                {err.message} <span className="text-[10px] text-rose-500 font-mono">({err.path})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Header Block: Business Info + Document Meta */}
      <div className="print-avoid-break mb-8 flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
        {/* Business Info */}
        {blocks.business ? (
          <div data-testid="preview-block-business" className="space-y-1.5 max-w-sm sm:max-w-md break-words">
            <h1 className="text-xl font-bold tracking-tight text-slate-950 break-words">
              {business.displayName || '(ยังไม่ระบุชื่อผู้ออกเอกสาร)'}
            </h1>
            <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600 break-words">
              {business.address || '(ยังไม่ระบุที่อยู่)'}
            </p>
            {(business.taxId || business.branchType) && (
              <div className="pt-1 text-[11px] text-slate-600 flex flex-wrap gap-x-2 gap-y-0.5">
                {business.taxId && (
                  <span>
                    เลขประจำตัวผู้เสียภาษี: <span className="font-mono font-semibold text-slate-900">{business.taxId}</span>
                  </span>
                )}
                {business.branchType && (
                  <span>
                    ({business.branchType === 'head_office' ? 'สำนักงานใหญ่' : `สาขา ${business.branchNumber || ''}`})
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic no-print">[ซ่อนข้อมูลผู้ออกเอกสาร]</div>
        )}

        {/* Document Meta */}
        <div className="text-left sm:text-right shrink-0">
          <div className="inline-block rounded-lg bg-indigo-50/90 px-4 py-2 text-indigo-950 border border-indigo-200">
            <span className="block text-base font-black tracking-wide text-indigo-900">
              {DOCUMENT_TITLES[document.documentType].th}
            </span>
            <span className="block text-[10px] font-bold tracking-wider text-indigo-700 uppercase">
              {DOCUMENT_TITLES[document.documentType].en}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-xs text-slate-700">
            <div className="flex justify-between sm:justify-end gap-3">
              <span className="text-slate-500">เลขที่ / No:</span>
              <span className="font-mono font-bold text-slate-950" data-testid="preview-doc-number">
                {document.documentNumber}
              </span>
            </div>
            <div className="flex justify-between sm:justify-end gap-3">
              <span className="text-slate-500">วันที่ / Date:</span>
              <span className="font-mono text-slate-950">{document.issueDate}</span>
            </div>
            {document.dueDate && (
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="text-slate-500">ครบกำหนด / Due:</span>
                <span className="font-mono text-slate-950">{document.dueDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Info Block */}
      {blocks.customer && (
        <div data-testid="preview-block-customer" className="print-avoid-break mb-8 rounded-xl bg-slate-50/80 p-4 border border-slate-200 break-words">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            ลูกค้า / ผู้ว่าจ้าง (Customer / Billed To)
          </span>
          <div className="text-sm font-bold text-slate-950 break-words">
            {customer.displayName || '(ยังไม่ระบุชื่อลูกค้า)'}
          </div>
          <div className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-700 break-words">
            {customer.address || '(ยังไม่ระบุที่อยู่)'}
          </div>
          {(customer.taxId || customer.branchType) && (
            <div className="mt-2 text-[11px] text-slate-600 flex flex-wrap gap-x-2 gap-y-0.5">
              {customer.taxId && (
                <span>
                  เลขประจำตัวผู้เสียภาษี: <span className="font-mono font-semibold text-slate-900">{customer.taxId}</span>
                </span>
              )}
              {customer.branchType && (
                <span>
                  ({customer.branchType === 'head_office' ? 'สำนักงานใหญ่' : `สาขา ${customer.branchNumber || ''}`})
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Items Table Block */}
      {blocks.items && (
        <div data-testid="preview-block-items" className="mb-8 overflow-x-auto print:overflow-visible">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-100/70 text-slate-700 font-bold uppercase text-[11px]">
                <th className="py-2.5 px-2 w-10 text-center">#</th>
                <th className="py-2.5 px-3">รายการสินค้า / บริการ (Description)</th>
                <th className="py-2.5 px-2 text-right w-18">จำนวน</th>
                <th className="py-2.5 px-2 text-right w-24">ราคา/หน่วย</th>
                <th className="py-2.5 px-2 text-right w-20">ส่วนลด</th>
                <th className="py-2.5 px-3 text-right w-28">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => {
                const calcLine = lineMap.get(item.id);
                const discountText =
                  item.discount.mode === 'none'
                    ? '-'
                    : item.discount.mode === 'percent'
                      ? `${item.discount.value}%`
                      : `${item.discount.value.toLocaleString('th-TH', { minimumFractionDigits: 2 })}฿`;

                return (
                  <tr key={item.id} className="print-avoid-break hover:bg-slate-50/50">
                    <td className="py-3 px-2 text-center text-slate-500 font-mono align-top">{idx + 1}</td>
                    <td className="py-3 px-3 align-top break-words">
                      <div className="font-medium text-slate-950 leading-relaxed break-words">{item.description}</div>
                      {blocks.itemImages && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 border border-slate-200/80 rounded px-2 py-0.5 w-fit">
                          <span>🖼️ รูปภาพประกอบสินค้า</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-800 align-top">{item.quantity}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-800 align-top">
                      {item.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-600 align-top">{discountText}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-950 align-top">
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
        <div data-testid="preview-block-adjustments" className="print-avoid-break mb-8 flex flex-col sm:flex-row justify-end">
          <div className="w-full sm:w-84 space-y-2 rounded-xl bg-slate-50/80 p-4 border border-slate-200 text-xs">
            <div className="flex justify-between text-slate-700">
              <span>รวมเป็นเงิน (Subtotal):</span>
              <span className="font-mono font-semibold text-slate-950">{totals.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
            </div>

            {totals.documentDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>ส่วนลดท้ายเอกสาร:</span>
                <span className="font-mono font-semibold">-{totals.documentDiscountAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
              </div>
            )}

            {totals.documentDiscountAmount > 0 && (
              <div className="flex justify-between text-slate-700 border-t border-slate-200/80 pt-1">
                <span>ยอดหลังหักส่วนลด:</span>
                <span className="font-mono font-semibold text-slate-950">{totals.amountAfterDiscount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
              </div>
            )}

            {totals.vatAmount > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                <span className="font-mono font-semibold text-slate-950">+{totals.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
              </div>
            )}

            {totals.whtAmount > 0 && (
              <div className="flex justify-between text-amber-900">
                <span>หักภาษี ณ ที่จ่าย ({totals.whtRatePercent}%):</span>
                <span className="font-mono font-semibold">-{totals.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
              </div>
            )}

            <div className="border-t-2 border-slate-300 pt-2 flex justify-between text-sm font-bold text-slate-950">
              <span>ยอดชำระสุทธิ (Net Total):</span>
              <span className="font-mono text-indigo-900">{totals.netPayable.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
            </div>

            {totals.depositAmount > 0 && (
              <div className="flex justify-between text-slate-700 border-t border-dashed border-slate-300 pt-1.5">
                <span>เงินมัดจำ (Deposit):</span>
                <span className="font-mono font-bold text-indigo-950">
                  {totals.depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Block */}
      {blocks.payment && document.payment.instructions && (
        <div data-testid="preview-block-payment" className="print-avoid-break mb-8 rounded-xl bg-slate-50/70 p-4 border border-slate-200 break-words">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            ข้อมูลการชำระเงิน (Payment Details)
          </span>
          <p className="whitespace-pre-line text-xs text-slate-800 leading-relaxed font-mono break-words">
            {document.payment.instructions}
          </p>
        </div>
      )}

      {/* Terms & Notes */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {blocks.terms && document.terms && (
          <div data-testid="preview-block-terms" className="print-avoid-break rounded-xl border border-slate-200 p-4 bg-slate-50/50 break-words">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              เงื่อนไขและข้อตกลง (Terms & Conditions)
            </span>
            <p className="whitespace-pre-line text-xs text-slate-700 leading-relaxed break-words">
              {document.terms}
            </p>
          </div>
        )}

        {blocks.notes && document.notes && (
          <div data-testid="preview-block-notes" className="print-avoid-break rounded-xl border border-slate-200 p-4 bg-slate-50/50 break-words">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              หมายเหตุ (Notes)
            </span>
            <p className="whitespace-pre-line text-xs text-slate-700 leading-relaxed break-words">
              {document.notes}
            </p>
          </div>
        )}
      </div>

      {/* Signatures Block */}
      {blocks.signatures && (
        <div data-testid="preview-block-signatures" className="print-avoid-break mt-8 border-t border-slate-200 pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
          <div>
            <div className="mx-auto mb-2 h-16 w-44 sm:w-52 border-b border-dashed border-slate-400"></div>
            <p className="font-semibold text-slate-900">ผู้สั่งซื้อ / ผู้ว่าจ้าง</p>
            <p className="text-[10px] text-slate-500">วันที่: ____ / ____ / ________</p>
          </div>
          <div>
            <div className="mx-auto mb-2 h-16 w-44 sm:w-52 border-b border-dashed border-slate-400"></div>
            <p className="font-semibold text-slate-900">ผู้ออกเอกสาร / ผู้มีอำนาจลงนาม</p>
            <p className="text-[10px] text-slate-500">วันที่: ____ / ____ / ________</p>
          </div>
        </div>
      )}
    </div>
  );
}
