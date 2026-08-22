'use client';

import React from 'react';
import type { PaymentConfig } from '../../../domain/document/types';

interface PaymentSectionProps {
  payment: PaymentConfig;
  onUpdatePayment: (patch: Partial<PaymentConfig>) => void;
  isVisible: boolean;
}

export function PaymentSection({ payment, onUpdatePayment, isVisible }: PaymentSectionProps) {
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
    </div>
  );
}
