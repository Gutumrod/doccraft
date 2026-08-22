'use client';

import React from 'react';
import type { CalculationTotals } from '../../../domain/calculation/types';
import type { AdjustmentConfig, DiscountConfig, DepositConfig, LineItem } from '../../../domain/document/types';
import type { VatStatus } from '../../../domain/tax/types';

interface AdjustmentsSectionProps {
  adjustments: AdjustmentConfig;
  items: LineItem[];
  vatStatus: VatStatus;
  totals?: CalculationTotals;
  onUpdateAdjustments: (patch: Partial<AdjustmentConfig>) => void;
  onToggleWhtBasisItem: (itemId: string) => void;
  isVisible: boolean;
}

export function AdjustmentsSection({
  adjustments,
  items,
  vatStatus,
  totals,
  onUpdateAdjustments,
  onToggleWhtBasisItem,
  isVisible,
}: AdjustmentsSectionProps) {
  if (!isVisible) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-xs text-slate-500 flex items-center justify-between">
        <span>การปรับยอดและภาษี (ซ่อนอยู่ - ข้อมูลยังคงอยู่ในระบบ)</span>
      </div>
    );
  }

  const isVatRegistered = vatStatus === 'registered';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <h2 className="mb-4 text-base font-semibold text-slate-900">5. ส่วนลด ภาษี และเงินมัดจำ (Adjustments & Taxes)</h2>

      <div className="space-y-5">
        {/* 1. Document-Level Discount */}
        <div className="rounded-lg border border-slate-200 p-3.5 bg-slate-50/50">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">ส่วนลดท้ายเอกสาร (Document Discount)</span>
          </div>
          <div className="flex gap-2">
            <select
              data-testid="select-doc-discount-mode"
              value={adjustments.documentDiscount.mode}
              onChange={(e) => {
                const mode = e.target.value as DiscountConfig['mode'];
                if (mode === 'none') {
                  onUpdateAdjustments({ documentDiscount: { mode: 'none' } });
                } else {
                  const currentVal = adjustments.documentDiscount.mode !== 'none' ? adjustments.documentDiscount.value : 0;
                  onUpdateAdjustments({ documentDiscount: { mode, value: currentVal } });
                }
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="none">ไม่มีส่วนลด</option>
              <option value="percent">คิดเป็นเปอร์เซ็นต์ (%)</option>
              <option value="fixed">ระบุจำนวนเงิน (บาท)</option>
            </select>

            {adjustments.documentDiscount.mode !== 'none' && (
              <input
                type="number"
                min={0}
                step="any"
                data-testid="input-doc-discount-val"
                value={adjustments.documentDiscount.value === 0 ? '' : adjustments.documentDiscount.value}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateAdjustments({
                    documentDiscount: {
                      mode: adjustments.documentDiscount.mode as 'percent' | 'fixed',
                      value: isNaN(val) ? 0 : val,
                    },
                  });
                }}
                placeholder="0.00"
                className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* 2. VAT Configuration */}
        <div className="rounded-lg border border-slate-200 p-3.5 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800">ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
              {!isVatRegistered && (
                <p className="text-[11px] text-amber-700">
                  ⚠️ ผู้ประกอบการยังไม่ได้เลือกสถานะจดทะเบียน VAT (ตั้งค่าในหมวดข้อมูลผู้ประกอบการ)
                </p>
              )}
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={adjustments.vat.enabled && isVatRegistered}
              data-testid="toggle-vat"
              disabled={!isVatRegistered}
              onClick={() => onUpdateAdjustments({ vat: { enabled: !adjustments.vat.enabled } })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                adjustments.vat.enabled && isVatRegistered ? 'bg-indigo-600' : 'bg-slate-300'
              } ${!isVatRegistered ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  adjustments.vat.enabled && isVatRegistered ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 3. Withholding Tax (WHT) */}
        <div className="rounded-lg border border-slate-200 p-3.5 bg-slate-50/50">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800">ภาษีหัก ณ ที่จ่าย (Withholding Tax - WHT)</span>
              <p className="text-[11px] text-slate-500">เลือกรายการที่เข้าเกณฑ์หักภาษี ณ ที่จ่าย (เช่น ค่าบริการ)</p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={adjustments.wht.enabled}
              data-testid="toggle-wht"
              onClick={() =>
                onUpdateAdjustments({
                  wht: {
                    ...adjustments.wht,
                    enabled: !adjustments.wht.enabled,
                  },
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                adjustments.wht.enabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  adjustments.wht.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {adjustments.wht.enabled && (
            <div className="space-y-3 border-t border-slate-200 pt-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-slate-700">อัตราหัก ณ ที่จ่าย (%):</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  data-testid="input-wht-rate"
                  value={adjustments.wht.ratePercent === 0 ? '' : adjustments.wht.ratePercent}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onUpdateAdjustments({
                      wht: {
                        ...adjustments.wht,
                        ratePercent: isNaN(val) ? 0 : val,
                      },
                    });
                  }}
                  className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-mono text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-xs text-slate-500">(เช่น บริการทั่วไป 3%, ค่าเช่า 5%, ค่าขนส่ง 1%)</span>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  เลือกรายการที่ต้องหัก ณ ที่จ่าย (WHT Basis Lines):
                </label>
                <div className="space-y-1.5">
                  {items.map((item, idx) => {
                    const isChecked = adjustments.wht.basisLineItemIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-2.5 rounded-lg border p-2 text-xs transition-colors cursor-pointer ${
                          isChecked ? 'border-indigo-300 bg-indigo-50/60 text-indigo-950 font-medium' : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          data-testid={`wht-line-checkbox-${item.id}`}
                          checked={isChecked}
                          onChange={() => onToggleWhtBasisItem(item.id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-mono text-slate-500">#{idx + 1}</span>
                        <span className="truncate">{item.description || '(ยังไม่ระบุชื่อรายการ)'}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Deposit Configuration */}
        <div className="rounded-lg border border-slate-200 p-3.5 bg-slate-50/50">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">เงินมัดจำ / เงินชำระล่วงหน้า (Deposit)</span>
          </div>
          <div className="flex gap-2">
            <select
              data-testid="select-deposit-mode"
              value={adjustments.deposit.mode}
              onChange={(e) => {
                const mode = e.target.value as DepositConfig['mode'];
                if (mode === 'none') {
                  onUpdateAdjustments({ deposit: { mode: 'none' } });
                } else {
                  const currentVal = adjustments.deposit.mode !== 'none' ? adjustments.deposit.value : 0;
                  onUpdateAdjustments({ deposit: { mode, value: currentVal } });
                }
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="none">ไม่มีเงินมัดจำ</option>
              <option value="percent">คิดเป็นเปอร์เซ็นต์ (%) ของยอดสุทธิ</option>
              <option value="fixed">ระบุจำนวนเงิน (บาท)</option>
            </select>

            {adjustments.deposit.mode !== 'none' && (
              <input
                type="number"
                min={0}
                step="any"
                data-testid="input-deposit-val"
                value={adjustments.deposit.value === 0 ? '' : adjustments.deposit.value}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateAdjustments({
                    deposit: {
                      mode: adjustments.deposit.mode as 'percent' | 'fixed',
                      value: isNaN(val) ? 0 : val,
                    },
                  });
                }}
                placeholder="0.00"
                className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Live Calculation Summary Feedback */}
        {totals && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-900">
              สรุปยอดคำนวณสด (Live Calculation Summary)
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>รวมเป็นเงิน (Subtotal):</span>
                <span className="font-mono font-semibold" data-testid="summary-subtotal">
                  {totals.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                </span>
              </div>

              {totals.documentDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>ส่วนลดท้ายเอกสาร:</span>
                  <span className="font-mono font-semibold" data-testid="summary-doc-discount">
                    -{totals.documentDiscountAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </span>
                </div>
              )}

              {totals.vatAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>ภาษีมูลค่าเพิ่ม VAT 7%:</span>
                  <span className="font-mono font-semibold" data-testid="summary-vat-amount">
                    +{totals.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </span>
                </div>
              )}

              {totals.whtAmount > 0 && (
                <div className="flex justify-between text-amber-800">
                  <span>หักภาษี ณ ที่จ่าย (ฐาน {totals.whtBasisAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿ @ {totals.whtRatePercent}%):</span>
                  <span className="font-mono font-semibold" data-testid="summary-wht-amount">
                    -{totals.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </span>
                </div>
              )}

              <div className="my-2 border-t border-indigo-200/80 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>ยอดชำระสุทธิ (Net Payable):</span>
                <span className="font-mono text-base text-indigo-700" data-testid="summary-net-payable">
                  {totals.netPayable.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                </span>
              </div>

              {totals.depositAmount > 0 && (
                <div className="flex justify-between text-slate-600 border-t border-dashed border-indigo-200 pt-1.5">
                  <span>เงินมัดจำที่ต้องชำระ:</span>
                  <span className="font-mono font-semibold text-indigo-900" data-testid="summary-deposit-amount">
                    {totals.depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
