'use client';

import React, { useState } from 'react';
import { calculateDocument } from '../../domain/calculation/calculate';
import type { DocCraftDocument } from '../../domain/document/types';
import { DocumentPreview } from '../preview/DocumentPreview';
import { BlockVisibilityControls } from './BlockVisibilityControls';
import { createInitialDocument } from './create-initial-document';
import {
  addLineItem,
  removeLineItem,
  setBlockVisibility,
  setDocumentType,
  toggleWhtBasisItem,
  updateAdjustments,
  updateBusinessProfile,
  updateCustomerProfile,
  updateDocumentHeader,
  updateLineItem,
  updatePayment,
  updateTermsAndNotes,
} from './editor-state';
import { AdjustmentsSection } from './sections/AdjustmentsSection';
import { BusinessSection } from './sections/BusinessSection';
import { CustomerSection } from './sections/CustomerSection';
import { DocumentSection } from './sections/DocumentSection';
import { ItemsSection } from './sections/ItemsSection';
import { PaymentSection } from './sections/PaymentSection';
import { TermsNotesSection } from './sections/TermsNotesSection';

export function DocCraftEditor() {
  const [doc, setDoc] = useState<DocCraftDocument>(() => createInitialDocument());
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Pure calculation result derived from domain rules on every render
  const calcResult = calculateDocument(doc);
  const totals = calcResult.ok ? calcResult.value : undefined;
  const errors = !calcResult.ok ? calcResult.errors : [];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20">
      {/* Top Application Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-base font-black text-white shadow-sm">
              DC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-950">DocCraft</h1>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                  Phase 2 Editor
                </span>
              </div>
              <p className="text-[11px] text-slate-500">ระบบสร้างเอกสารธุรกิจแบบโมดูลาร์</p>
            </div>
          </div>

          {/* Compact View Tab Switcher (<1024px) */}
          <div className="flex lg:hidden rounded-lg bg-slate-200/80 p-1 text-xs font-semibold">
            <button
              type="button"
              data-testid="tab-switch-editor"
              onClick={() => setActiveTab('editor')}
              className={`rounded-md px-3 py-1.5 transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✏️ แก้ไข (Editor)
            </button>
            <button
              type="button"
              data-testid="tab-switch-preview"
              onClick={() => setActiveTab('preview')}
              className={`rounded-md px-3 py-1.5 transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👁️ ตัวอย่าง (Preview)
            </button>
          </div>

          {/* Desktop Summary Badge */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-medium">
            <div className="text-right">
              <span className="block text-slate-500">ยอดชำระสุทธิ (Net Total)</span>
              <span className="font-mono text-sm font-bold text-indigo-700" data-testid="header-net-payable">
                {totals ? `${totals.netPayable.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿` : 'ข้อผิดพลาด'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Global Validation Errors Banner */}
        {errors.length > 0 && (
          <div
            data-testid="global-validation-alert"
            className="mb-6 rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 shadow-xs"
          >
            <div className="flex items-center gap-2 font-bold text-rose-800 mb-1.5">
              <span>⚠️</span> ข้อมูลในเอกสารยังไม่สมบูรณ์ ({errors.length} รายการ):
            </div>
            <ul className="list-disc pl-5 space-y-1 text-rose-700">
              {errors.map((err, i) => (
                <li key={i}>
                  <span className="font-semibold">{err.message}</span>{' '}
                  <span className="text-[10px] text-rose-500 font-mono">({err.path})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 2-Pane Responsive Grid */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left Pane: Editor Form (Visible on desktop OR when mobile activeTab === 'editor') */}
          <div
            className={`space-y-6 lg:col-span-7 ${
              activeTab === 'editor' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Modular Blocks Controls */}
            <BlockVisibilityControls
              blocks={doc.blocks}
              onChange={(key, visible) => setDoc((d) => setBlockVisibility(d, key, visible))}
            />

            {/* 1. Document Header */}
            <DocumentSection
              document={doc}
              onSelectDocumentType={(type) => setDoc((d) => setDocumentType(d, type))}
              onUpdateHeader={(patch) => setDoc((d) => updateDocumentHeader(d, patch))}
            />

            {/* 2. Business Profile */}
            <BusinessSection
              business={doc.business}
              isVisible={doc.blocks.business}
              onUpdateBusiness={(patch) => setDoc((d) => updateBusinessProfile(d, patch))}
            />

            {/* 3. Customer Profile */}
            <CustomerSection
              customer={doc.customer}
              isVisible={doc.blocks.customer}
              onUpdateCustomer={(patch) => setDoc((d) => updateCustomerProfile(d, patch))}
            />

            {/* 4. Items */}
            <ItemsSection
              items={doc.items}
              calculatedLines={totals?.lines}
              isVisible={doc.blocks.items}
              showItemImages={doc.blocks.itemImages}
              onAddItem={() => setDoc((d) => addLineItem(d))}
              onRemoveItem={(id) => setDoc((d) => removeLineItem(d, id))}
              onUpdateItem={(id, patch) => setDoc((d) => updateLineItem(d, id, patch))}
            />

            {/* 5. Adjustments & Taxes */}
            <AdjustmentsSection
              adjustments={doc.adjustments}
              items={doc.items}
              vatStatus={doc.business.vatStatus}
              totals={totals}
              isVisible={doc.blocks.adjustments}
              onUpdateAdjustments={(patch) => setDoc((d) => updateAdjustments(d, patch))}
              onToggleWhtBasisItem={(itemId) => setDoc((d) => toggleWhtBasisItem(d, itemId))}
            />

            {/* 6. Payment Instructions */}
            <PaymentSection
              payment={doc.payment}
              isVisible={doc.blocks.payment}
              onUpdatePayment={(patch) => setDoc((d) => updatePayment(d, patch))}
            />

            {/* 7. Terms & Notes */}
            <TermsNotesSection
              terms={doc.terms}
              notes={doc.notes}
              blocks={doc.blocks}
              onUpdateTermsNotes={(patch) => setDoc((d) => updateTermsAndNotes(d, patch))}
            />
          </div>

          {/* Right Pane: Live Presentation Preview (Visible on desktop OR when mobile activeTab === 'preview') */}
          <div
            className={`lg:col-span-5 ${
              activeTab === 'preview' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="sticky top-20">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                <span>👁️ แสดงตัวอย่างเอกสารสด (Live Presentation Preview)</span>
                <span className="text-[10px] text-slate-400">อัปเดตอัตโนมัติตามข้อมูลที่กรอก</span>
              </div>
              <DocumentPreview document={doc} totals={totals} errors={errors} />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Sticky Bar for compact view (<1024px) */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur-sm p-3 lg:hidden flex items-center justify-between shadow-lg">
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-500">ยอดชำระสุทธิ</span>
          <span className="font-mono text-sm font-black text-indigo-700" data-testid="mobile-net-payable">
            {totals ? `${totals.netPayable.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿` : 'กรุณาแก้ไขข้อผิดพลาด'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab((t) => (t === 'editor' ? 'preview' : 'editor'))}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
        >
          {activeTab === 'editor' ? 'ดูตัวอย่างเอกสาร 👁️' : 'กลับไปแก้ไข ✏️'}
        </button>
      </div>
    </div>
  );
}
