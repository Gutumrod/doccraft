'use client';

import React from 'react';
import type { BlockVisibility } from '../../domain/document/types';

interface BlockVisibilityControlsProps {
  blocks: BlockVisibility;
  onChange: (block: keyof BlockVisibility, visible: boolean) => void;
}

const BLOCK_CONFIGS: { key: keyof BlockVisibility; label: string; description: string }[] = [
  { key: 'business', label: 'ข้อมูลผู้ออกเอกสาร', description: 'ชื่อผู้ประกอบการ ที่อยู่ เลขประจำตัวผู้เสียภาษี' },
  { key: 'customer', label: 'ข้อมูลลูกค้า', description: 'ชื่อลูกค้า/บริษัท ที่อยู่จัดส่ง/วางบิล' },
  { key: 'items', label: 'ตารางรายการสินค้า', description: 'รายการ จำนวน ราคา ส่วนลดรายบรรทัด' },
  { key: 'itemImages', label: 'รูปภาพสินค้า', description: 'รูปภาพประกอบรายการสินค้า/งานบริการ' },
  { key: 'adjustments', label: 'ภาษีและส่วนลด', description: 'ส่วนลดเอกสาร, VAT 7%, หัก ณ ที่จ่าย, มัดจำ' },
  { key: 'payment', label: 'ข้อมูลการชำระเงิน', description: 'ช่องทางชำระเงิน บัญชีธนาคาร' },
  { key: 'terms', label: 'เงื่อนไขและข้อตกลง', description: 'กำหนดยืนราคา ระยะเวลาส่งมอบ' },
  { key: 'notes', label: 'หมายเหตุ', description: 'ข้อความเพิ่มเติมท้ายเอกสาร' },
  { key: 'signatures', label: 'ช่องลงลายมือชื่อ', description: 'ลายมือชื่อผู้อนุมัติ/ผู้รับมอบงาน' },
];

export function BlockVisibilityControls({ blocks, onChange }: BlockVisibilityControlsProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">บล็อกและส่วนประกอบเอกสาร (Modular Blocks)</h3>
          <p className="text-xs text-slate-500">เลือกเปิด/ซ่อนบล็อกตามประเภทเอกสาร (ข้อมูลจะไม่สูญหายเมื่อซ่อน)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3">
        {BLOCK_CONFIGS.map(({ key, label }) => {
          const isVisible = blocks[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key, !isVisible)}
              data-testid={`toggle-block-${key}`}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                isVisible
                  ? 'border-indigo-200 bg-indigo-50/50 text-indigo-900 hover:bg-indigo-100/60'
                  : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
            >
              <span className="truncate">{label}</span>
              <span
                className={`ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  isVisible ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-600'
                }`}
              >
                {isVisible ? '✓' : '✕'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
