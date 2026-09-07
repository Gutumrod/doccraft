'use client';

import React from 'react';
import type { PaymentConfig } from '../../../domain/document/types';

interface PaymentSectionProps {
  payment: PaymentConfig;
  onUpdatePayment: (patch: Partial<PaymentConfig>) => void;
  isVisible: boolean;
}

export function PaymentSection({ payment, onUpdatePayment, isVisible }: PaymentSectionProps) {
  const updatePromptPay = (patch: Partial<PaymentConfig['promptPay']>) => {
    onUpdatePayment({ promptPay: { ...payment.promptPay, ...patch } });
  };

  if (!isVisible) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-xs text-slate-500 flex items-center justify-between">
        <span>ข้อมูลการชำระเงิน (ซ่อนอยู่ - ข้อมูลยังคงอยู่ในระบบ)</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <h2 className="mb-4 text-base font-semibold text-slate-900">6. ช่องทางการชำระเงิน (Payment Instructions)</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="paymentInstructions" className="mb-1 block text-xs font-medium text-slate-700">
            ข้อมูลบัญชีธนาคาร / ข้อความการชำระเงิน
          </label>
          <textarea
            id="paymentInstructions"
            data-testid="input-payment-instructions"
            rows={3}
            value={payment.instructions || ''}
            onChange={(e) => onUpdatePayment({ instructions: e.target.value })}
            placeholder="ธนาคารกสิกรไทย สาขาสยามสแควร์&#10;เลขที่บัญชี: 123-4-56789-0&#10;ชื่อบัญชี: บจก. ตัวอย่าง คอร์ปอเรชั่น"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <input
              type="checkbox"
              data-testid="input-promptpay-enabled"
              checked={payment.promptPay.enabled}
              onChange={(e) => updatePromptPay({ enabled: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            แสดง PromptPay QR บนเอกสาร
          </label>
          {payment.promptPay.enabled && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="promptPayIdentifierType" className="mb-1 block text-xs font-medium text-slate-700">
                  ประเภท PromptPay
                </label>
                <select
                  id="promptPayIdentifierType"
                  data-testid="select-promptpay-identifier-type"
                  value={payment.promptPay.identifierType}
                  onChange={(e) => updatePromptPay({ identifierType: e.target.value as PaymentConfig['promptPay']['identifierType'] })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="mobile">เบอร์มือถือ</option>
                  <option value="national_id_tax_id">เลขบัตรประชาชน / เลขผู้เสียภาษี 13 หลัก</option>
                </select>
              </div>

              <div>
                <label htmlFor="promptPayIdentifier" className="mb-1 block text-xs font-medium text-slate-700">
                  หมายเลข PromptPay
                </label>
                <input
                  id="promptPayIdentifier"
                  data-testid="input-promptpay-identifier"
                  value={payment.promptPay.identifier}
                  onChange={(e) => updatePromptPay({ identifier: e.target.value })}
                  placeholder={payment.promptPay.identifierType === 'mobile' ? '081-234-5678' : '1234567890123'}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="promptPayAmountMode" className="mb-1 block text-xs font-medium text-slate-700">
                  จำนวนเงินใน QR
                </label>
                <select
                  id="promptPayAmountMode"
                  data-testid="select-promptpay-amount-mode"
                  value={payment.promptPay.amountMode}
                  onChange={(e) => updatePromptPay({ amountMode: e.target.value as PaymentConfig['promptPay']['amountMode'] })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="none">ไม่กำหนดจำนวนเงิน</option>
                  <option value="deposit">ยอดมัดจำ (Deposit)</option>
                  <option value="net_payable">ยอดชำระสุทธิ (Net Payable)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  QR ถูกสร้างในเบราว์เซอร์เท่านั้น และไม่ได้ยืนยันสถานะการชำระเงิน
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
