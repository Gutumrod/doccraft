'use client';

import React, { useEffect, useRef, useState } from 'react';
import { calculateDocument } from '../../domain/calculation/calculate';
import type { DocCraftDocument } from '../../domain/document/types';
import {
  longCustomerAndAddressFixture,
  minimalBlocksFixture,
  multiPageDocumentFixture,
  onePageQuotationFixture,
  richThaiTextFixture,
  withItemImagesFixture,
} from '../../domain/fixtures/representative-documents';
import { exportDocumentAsJson, importDocumentFromJson } from '../../persistence/import-export';
import { clearDraft, loadDraft, saveDraft } from '../../persistence/storage';
import type { StorageStatus } from '../../persistence/types';
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
  const [storageStatus, setStorageStatus] = useState<StorageStatus>('saved');
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);

  // Pure calculation result derived from domain rules on every render
  const calcResult = calculateDocument(doc);
  const isValid = calcResult.ok;
  const totals = calcResult.ok ? calcResult.value : undefined;
  const errors = !calcResult.ok ? calcResult.errors : [];

  // Restore draft from browser storage on client mount
  useEffect(() => {
    queueMicrotask(() => {
      const loadResult = loadDraft();
      if (loadResult.ok) {
        if (loadResult.value) {
          setDoc(loadResult.value);
          setStorageStatus('saved');
        }
      } else {
        setStorageNotice(`⚠️ ไม่สามารถกู้คืนข้อมูลเดิมได้: ${loadResult.error.message}`);
        setStorageStatus('error');
      }
      isInitialized.current = true;
    });
  }, []);

  // Autosave effect with debounce when document state updates (after mount initialization)
  useEffect(() => {
    if (!isInitialized.current) return;

    const timer = setTimeout(() => {
      const saveResult = saveDraft(doc);
      if (saveResult.ok) {
        setStorageStatus('saved');
        setStorageNotice(null);
      } else {
        setStorageStatus('error');
        setStorageNotice(
          '⚠️ ไม่สามารถบันทึกข้อมูลลงในเบราว์เซอร์ได้ (พื้นที่เต็มหรือเบราว์เซอร์บล็อก LocalStorage) - คุณยังสามารถแก้ไขและ Export JSON ได้'
        );
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [doc]);

  const handlePrint = () => {
    // Fail-closed protection: never invoke native print for invalid documents
    if (!isValid) {
      return;
    }
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleExport = () => {
    exportDocumentAsJson(doc);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== 'string') return;

      const importResult = importDocumentFromJson(content);
      if (importResult.ok) {
        setDoc(importResult.value);
        saveDraft(importResult.value);
        setImportError(null);
      } else {
        setImportError(`⚠️ นำเข้าไฟล์ไม่สำเร็จ: ${importResult.error.message}`);
      }
    };
    reader.onerror = () => {
      setImportError('⚠️ ไม่สามารถอ่านไฟล์ที่เลือกได้');
    };
    reader.readAsText(file);
  };

  const handleNewDocument = () => {
    const freshDoc = createInitialDocument();
    setDoc(freshDoc);
    clearDraft();
    setImportError(null);
    setStorageNotice(null);
    setStorageStatus('saved');
  };

  const loadFixture = (fixture: DocCraftDocument) => {
    setDoc(fixture);
    saveDraft(fixture);
    setImportError(null);
  };

  return (
    <div className="doccraft-app-shell min-h-screen bg-slate-100 text-slate-900 pb-20 overflow-x-hidden">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        data-testid="input-import-file"
        className="hidden"
      />

      {/* Top Application Header (Hidden in print) */}
      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm sm:text-base font-black text-white shadow-sm">
              DC
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-950 truncate">DocCraft</h1>
                <span className="hidden sm:inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                  Phase 4 Local-First
                </span>
                {/* Autosave Status Indicator */}
                {storageStatus === 'saved' && (
                  <span
                    data-testid="status-autosave-saved"
                    className="hidden md:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200"
                  >
                    ✓ บันทึกอัตโนมัติแล้ว
                  </span>
                )}
                {storageStatus === 'error' && (
                  <span
                    data-testid="status-autosave-error"
                    className="hidden md:inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200"
                  >
                    ⚠️ บันทึกไม่สำเร็จ
                  </span>
                )}
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 truncate">ระบบสร้างเอกสารธุรกิจแบบโมดูลาร์ พิมพ์ A4 และสำรองข้อมูล JSON</p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Fixture Selector (Useful for quick validation & demonstrations) */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 border-r border-slate-200 pr-2">
              <span className="text-[11px]">ตัวอย่าง:</span>
              <select
                data-testid="select-fixture"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'one-page') loadFixture(onePageQuotationFixture);
                  else if (val === 'multi-page') loadFixture(multiPageDocumentFixture);
                  else if (val === 'thai-text') loadFixture(richThaiTextFixture);
                  else if (val === 'long-customer') loadFixture(longCustomerAndAddressFixture);
                  else if (val === 'with-images') loadFixture(withItemImagesFixture);
                  else if (val === 'minimal') loadFixture(minimalBlocksFixture);
                  else if (val === 'default') loadFixture(createInitialDocument());
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="default">เอกสารเริ่มต้น (Default)</option>
                <option value="one-page">1 หน้า (One-Page Quotation)</option>
                <option value="multi-page">2+ หน้า (Multi-Page Invoice)</option>
                <option value="thai-text">ข้อความไทย (Rich Thai Receipt)</option>
                <option value="long-customer">ข้อความยาว (Long Customer / Tax Invoice)</option>
                <option value="with-images">มีรูปภาพ (With Item Images)</option>
                <option value="minimal">บล็อกขั้นต่ำ (Minimal Blocks)</option>
              </select>
            </div>

            {/* Backup & Recovery Actions (Export / Import / New) */}
            <button
              type="button"
              data-testid="btn-new-document"
              onClick={handleNewDocument}
              title="สร้างเอกสารใหม่และรีเซ็ตข้อมูล"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all active:scale-95"
            >
              <span>📄</span>
              <span className="hidden sm:inline">สร้างใหม่</span>
            </button>

            <button
              type="button"
              data-testid="btn-import-json"
              onClick={handleImportClick}
              title="นำเข้าเอกสารจากไฟล์ JSON สำรอง"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all active:scale-95"
            >
              <span>📥</span>
              <span className="hidden sm:inline">นำเข้า JSON</span>
            </button>

            <button
              type="button"
              data-testid="btn-export-json"
              onClick={handleExport}
              title="ส่งออกเอกสารเป็นไฟล์ JSON เพื่อสำรองข้อมูล"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all active:scale-95"
            >
              <span>📤</span>
              <span className="hidden sm:inline">ส่งออก JSON</span>
            </button>

            {/* Compact View Tab Switcher (<1024px) */}
            <div className="flex lg:hidden rounded-lg bg-slate-200/80 p-0.5 sm:p-1 text-xs font-semibold">
              <button
                type="button"
                data-testid="tab-switch-editor"
                onClick={() => setActiveTab('editor')}
                className={`rounded-md px-2.5 py-1 sm:px-3 sm:py-1.5 transition-all text-xs ${
                  activeTab === 'editor'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✏️ แก้ไข
              </button>
              <button
                type="button"
                data-testid="tab-switch-preview"
                onClick={() => setActiveTab('preview')}
                className={`rounded-md px-2.5 py-1 sm:px-3 sm:py-1.5 transition-all text-xs ${
                  activeTab === 'preview'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👁️ ตัวอย่าง
              </button>
            </div>

            {/* Desktop Print Button (>=1024px) */}
            <button
              type="button"
              data-testid="btn-print-document"
              onClick={handlePrint}
              disabled={!isValid}
              title={!isValid ? 'กรุณาแก้ไขข้อผิดพลาดในเอกสารก่อนพิมพ์' : 'พิมพ์เอกสาร A4'}
              className={`hidden lg:inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all ${
                isValid
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <span>🖨️</span>
              <span>พิมพ์เอกสาร A4</span>
            </button>

            {/* Desktop Summary Badge */}
            <div className="hidden 2xl:flex items-center gap-4 text-xs font-medium border-l border-slate-200 pl-3">
              <div className="text-right">
                <span className="block text-[11px] text-slate-500">ยอดชำระสุทธิ (Net Total)</span>
                <span className="font-mono text-sm font-bold text-indigo-700" data-testid="header-net-payable">
                  {totals ? `${totals.netPayable.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿` : 'ข้อผิดพลาด'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        {/* Storage Notice Banner (Hidden in print) */}
        {storageNotice && (
          <div
            data-testid="storage-notice-alert"
            className="no-print mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-xs flex items-center justify-between"
          >
            <span>{storageNotice}</span>
            <button
              type="button"
              onClick={() => setStorageNotice(null)}
              className="text-amber-700 hover:text-amber-900 font-bold ml-2 text-xs"
            >
              ✕ ปิด
            </button>
          </div>
        )}

        {/* Import Error Banner (Hidden in print) */}
        {importError && (
          <div
            data-testid="import-error-alert"
            className="no-print mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-900 shadow-xs flex items-center justify-between"
          >
            <span>{importError}</span>
            <button
              type="button"
              onClick={() => setImportError(null)}
              className="text-rose-700 hover:text-rose-900 font-bold ml-2 text-xs"
            >
              ✕ ปิด
            </button>
          </div>
        )}

        {/* Global Validation Errors Banner (Hidden in print) */}
        {errors.length > 0 && (
          <div
            data-testid="global-validation-alert"
            className="no-print global-validation-alert mb-6 rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 shadow-xs"
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
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 print:block">
          {/* Left Pane: Editor Form (Visible on desktop OR when mobile activeTab === 'editor'; Hidden in print) */}
          <div
            className={`space-y-6 lg:col-span-7 editor-pane no-print ${
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

          {/* Right Pane: Live A4 Presentation Preview */}
          <div
            className={`preview-pane lg:col-span-5 print:!block ${
              activeTab === 'preview' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="sticky top-20">
              <div className="no-print mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                <span>👁️ แสดงตัวอย่างเอกสาร A4 (Live Preview)</span>
                <button
                  type="button"
                  data-testid="btn-preview-print"
                  onClick={handlePrint}
                  disabled={!isValid}
                  title={!isValid ? 'กรุณาแก้ไขข้อผิดพลาดในเอกสารก่อนพิมพ์' : 'พิมพ์เอกสาร'}
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold transition-colors ${
                    isValid
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>🖨️ พิมพ์ (Print)</span>
                </button>
              </div>
              <DocumentPreview document={doc} totals={totals} errors={errors} />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Sticky Bar for compact view (<1024px, Hidden in print) */}
      <div className="no-print mobile-bottom-bar fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur-sm p-3 lg:hidden flex items-center justify-between shadow-lg">
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-500">ยอดชำระสุทธิ</span>
          <span className="font-mono text-sm font-black text-indigo-700" data-testid="mobile-net-payable">
            {totals ? `${totals.netPayable.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿` : 'กรุณาแก้ไขข้อผิดพลาด'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            data-testid="btn-mobile-export"
            onClick={handleExport}
            className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-2 text-xs font-bold text-slate-800 shadow-2xs active:scale-95 transition-all"
          >
            📤 ส่งออก
          </button>
          <button
            type="button"
            data-testid="btn-mobile-print"
            onClick={handlePrint}
            disabled={!isValid}
            title={!isValid ? 'กรุณาแก้ไขข้อผิดพลาดในเอกสารก่อนพิมพ์' : 'พิมพ์เอกสาร'}
            className={`rounded-lg px-3 py-2 text-xs font-bold shadow-sm transition-all ${
              isValid
                ? 'bg-slate-800 text-white hover:bg-slate-900 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            🖨️ พิมพ์
          </button>
          <button
            type="button"
            onClick={() => setActiveTab((t) => (t === 'editor' ? 'preview' : 'editor'))}
            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
          >
            {activeTab === 'editor' ? 'ดูตัวอย่าง 👁️' : 'แก้ไข ✏️'}
          </button>
        </div>
      </div>
    </div>
  );
}
