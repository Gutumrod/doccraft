'use client';

import React from 'react';
import type { CalculatedLine } from '../../../domain/calculation/types';
import type { DiscountConfig, LineItem } from '../../../domain/document/types';

interface ItemsSectionProps {
  items: LineItem[];
  calculatedLines?: CalculatedLine[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, patch: Partial<Omit<LineItem, 'id'>>) => void;
  isVisible: boolean;
  showItemImages: boolean;
}

export function ItemsSection({
  items,
  calculatedLines = [],
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  isVisible,
  showItemImages,
}: ItemsSectionProps) {
  if (!isVisible) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-xs text-slate-500 flex items-center justify-between">
        <span>ตารางรายการสินค้า/บริการ (ซ่อนอยู่ - ข้อมูลยังคงอยู่ในระบบ)</span>
      </div>
    );
  }

  const lineMap = new Map(calculatedLines.map((line) => [line.id, line]));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">4. รายการสินค้าและบริการ (Line Items)</h2>
          <p className="text-xs text-slate-500">ระบุรายการ จำนวน ราคาต่อหน่วย และส่วนลดรายบรรทัด</p>
        </div>
        <button
          type="button"
          data-testid="btn-add-item"
          onClick={onAddItem}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all active:scale-95"
        >
          <span>＋</span> เพิ่มรายการ
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const calcLine = lineMap.get(item.id);
          const isOnlyItem = items.length <= 1;

          return (
            <div
              key={item.id}
              data-testid={`item-row-${item.id}`}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center justify-center rounded-md bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
                  #{index + 1}
                </span>

                <div className="flex items-center gap-3">
                  {calcLine && (
                    <span className="text-xs font-semibold text-slate-600">
                      รวมบรรทัดนี้: <span className="font-mono text-indigo-700">{calcLine.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span> บาท
                    </span>
                  )}

                  <button
                    type="button"
                    data-testid={`btn-remove-item-${item.id}`}
                    disabled={isOnlyItem}
                    onClick={() => onRemoveItem(item.id)}
                    title={isOnlyItem ? 'เอกสารต้องมีอย่างน้อย 1 รายการ' : 'ลบรายการนี้'}
                    className={`rounded-md p-1 text-xs transition-colors ${
                      isOnlyItem
                        ? 'cursor-not-allowed text-slate-300'
                        : 'text-rose-500 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    🗑️ ลบ
                  </button>
                </div>
              </div>

              {/* Item Image Placeholder slot if enabled */}
              {showItemImages && (
                <div className="mb-3 flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-2.5 text-xs text-slate-500">
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-100 text-slate-400">
                    🖼️
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">รูปภาพประกอบรายการ</span>
                    <span className="block text-[11px] text-slate-400">(บล็อกรูปภาพแสดงผลในพรีวิว)</span>
                  </div>
                </div>
              )}

              {/* Description Input */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  รายละเอียดสินค้า / บริการ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  data-testid={`input-item-desc-${item.id}`}
                  value={item.description}
                  onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
                  placeholder="เช่น ค่าบริการออกแบบเว็บไซต์, เสื้อยืดพิมพ์ลาย Size L"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Quantity, Unit Price, Line Discount Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    จำนวน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step="any"
                    data-testid={`input-item-qty-${item.id}`}
                    value={item.quantity === 0 ? '' : item.quantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateItem(item.id, { quantity: isNaN(val) ? 0 : val });
                    }}
                    placeholder="1"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    ราคาต่อหน่วย (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    data-testid={`input-item-price-${item.id}`}
                    value={item.unitPrice === 0 ? '' : item.unitPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateItem(item.id, { unitPrice: isNaN(val) ? 0 : val });
                    }}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    ส่วนลดรายบรรทัด
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      data-testid={`select-item-discount-mode-${item.id}`}
                      value={item.discount.mode}
                      onChange={(e) => {
                        const mode = e.target.value as DiscountConfig['mode'];
                        if (mode === 'none') {
                          onUpdateItem(item.id, { discount: { mode: 'none' } });
                        } else {
                          const currentVal = item.discount.mode !== 'none' ? item.discount.value : 0;
                          onUpdateItem(item.id, { discount: { mode, value: currentVal } });
                        }
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="none">ไม่มี</option>
                      <option value="percent">%</option>
                      <option value="fixed">บาท</option>
                    </select>

                    {item.discount.mode !== 'none' && (
                      <input
                        type="number"
                        min={0}
                        step="any"
                        data-testid={`input-item-discount-val-${item.id}`}
                        value={item.discount.value === 0 ? '' : item.discount.value}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onUpdateItem(item.id, {
                            discount: {
                              mode: item.discount.mode as 'percent' | 'fixed',
                              value: isNaN(val) ? 0 : val,
                            },
                          });
                        }}
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
