'use client';

import React, { useEffect, useRef, useState } from 'react';
import { NextIntlClientProvider, useLocale, useTranslations } from 'next-intl';
import { LanguageToggle } from '../../components/LanguageToggle';
import { localeMessages, type Locale } from '../../i18n/locale-provider';
import { calculateDocument } from '../../domain/calculation/calculate';
import type { DocCraftDocument } from '../../domain/document/types';
import { resolvePromptPay } from '../../domain/promptpay/resolve';
import {
  longCustomerAndAddressFixture,
  minimalBlocksFixture,
  multiPageDocumentFixture,
  onePageQuotationFixture,
  richThaiTextFixture,
  withItemImagesFixture,
} from '../../domain/fixtures/representative-documents';
import {
  exportDocumentAsJson,
  importDocumentFromJson,
  MAX_IMPORT_JSON_BYTES,
} from '../../persistence/import-export';
import { clearDraft, loadDraft, saveDraft } from '../../persistence/storage';
import type { StorageStatus } from '../../persistence/types';
import { DocumentPreview } from '../preview/DocumentPreview';
import { BlockVisibilityControls } from './BlockVisibilityControls';
import { createInitialDocument } from './create-initial-document';
import { PilotNotice } from './PilotNotice';
import {
  addLineItem,
  removeLineItem,
  setBlockVisibility,
  setDocumentType,
  toggleWhtBasisItem,
  updateAdjustments,
  updateBusinessLogo,
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

const DOCUMENT_LOCALE_KEY = 'doccraft_document_locale';

export function DocCraftEditor() {
  const t = useTranslations('app');
  const locale = useLocale();
  const [documentLocale, setDocumentLocale] = useState<Locale>('th');
  const [doc, setDoc] = useState<DocCraftDocument>(() => createInitialDocument());
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [storageStatus, setStorageStatus] = useState<StorageStatus>('saved');
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);

  // Pure calculation result derived from domain rules on every render
  const calcResult = calculateDocument(doc);
  const totals = calcResult.ok ? calcResult.value : undefined;
  const formattedNetTotal = totals ? new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', { style: 'currency', currency: 'THB' }).format(totals.netPayable) : null;
  const promptPayActive = doc.blocks.payment && doc.payment.promptPay.enabled;
  const promptPayResult = calcResult.ok && promptPayActive
    ? resolvePromptPay(doc.payment.promptPay, calcResult.value)
    : null;
  const promptPayErrors = promptPayResult && !promptPayResult.ok ? promptPayResult.errors : [];
  const errors = calcResult.ok ? promptPayErrors : calcResult.errors;
  const isValid = calcResult.ok && promptPayErrors.length === 0;
  const resolvedPromptPay = promptPayResult?.ok ? promptPayResult.value : undefined;

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
        setStorageNotice(t('storageRestoreFailed', { message: t(`persistenceErrors.${loadResult.error.code}`) }));
        setStorageStatus('error');
      }
      isInitialized.current = true;
    });
  }, [t]);

  useEffect(() => {
    try {
      const savedLocale = window.localStorage.getItem(DOCUMENT_LOCALE_KEY);
      if (savedLocale === 'th' || savedLocale === 'en') queueMicrotask(() => setDocumentLocale(savedLocale));
    } catch {
      // Keep Thai as the safe default when browser storage is unavailable.
    }
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
          t('storageSaveFailed')
        );
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [doc, t]);

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
    if (file.size <= 0 || file.size > MAX_IMPORT_JSON_BYTES) {
      setImportError(t('importInvalidSize'));
      return;
    }

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
        setImportError(t('importFailed', { message: t(`persistenceErrors.${importResult.error.code}`) }));
      }
    };
    reader.onerror = () => {
      setImportError(t('importReadFailed'));
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
                  Public Pilot
                </span>
                {/* Autosave Status Indicator */}
                {storageStatus === 'saved' && (
                  <span
                    data-testid="status-autosave-saved"
                    className="hidden md:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200"
                  >
                    {t('saved')}
                  </span>
                )}
                {storageStatus === 'error' && (
                  <span
                    data-testid="status-autosave-error"
                    className="hidden md:inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200"
                  >
                    {t('saveFailed')}
                  </span>
                )}
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 truncate">{t('subtitle')}</p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <LanguageToggle />
            {/* Fixture Selector (Useful for quick validation & demonstrations) */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 border-r border-slate-200 pr-2">
              <span className="text-[11px]">{t('fixtureLabel')}</span>
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
                <option value="default">{t('fixtures.default')}</option>
                <option value="one-page">{t('fixtures.onePage')}</option>
                <option value="multi-page">{t('fixtures.multiPage')}</option>
                <option value="thai-text">{t('fixtures.thai')}</option>
                <option value="long-customer">{t('fixtures.long')}</option>
                <option value="with-images">{t('fixtures.images')}</option>
                <option value="minimal">{t('fixtures.minimal')}</option>
              </select>
            </div>

            {/* Backup & Recovery Actions (Export / Import / New) */}
            <button
              type="button"
              data-testid="btn-new-document"
              onClick={handleNewDocument}
              title={t('newDocument')}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all active:scale-95"
            >
              <span>📄</span>
              <span className="hidden sm:inline">{t('new')}</span>
            </button>

            <button
              hidden
              type="button"
              data-testid="btn-import-json"
              onClick={handleImportClick}
              title={t('importTitle')}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all active:scale-95"
            >
              <span>📥</span>
              <span className="hidden sm:inline">{t('import')}</span>
            </button>

            <button
              hidden
              type="button"
              data-testid="btn-export-json"
              onClick={handleExport}
              title={t('exportTitle')}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all active:scale-95"
            >
              <span>📤</span>
              <span className="hidden sm:inline">{t('export')}</span>
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
                ✏️ {t('edit')}
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
                👁️ {t('preview')}
              </button>
            </div>

            {/* Desktop Print Button (>=1024px) */}
            <button
              type="button"
              data-testid="btn-print-document"
              onClick={handlePrint}
              disabled={!isValid}
              title={!isValid ? t('printInvalid') : t('printA4')}
              className={`hidden lg:inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all ${
                isValid
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <span>🖨️</span>
              <span>{t('printA4')}</span>
            </button>

            {/* Desktop Summary Badge */}
            <div className="hidden 2xl:flex items-center gap-4 text-xs font-medium border-l border-slate-200 pl-3">
              <div className="text-right">
                <span className="block text-[11px] text-slate-500">{t('netTotal')}</span>
                <span className="font-mono text-sm font-bold text-indigo-700" data-testid="header-net-payable">
                  {formattedNetTotal ?? t('error')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <PilotNotice />

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
              ✕ {t('close')}
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
              ✕ {t('close')}
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
              <span>⚠️</span> {t('incomplete', { count: errors.length })}
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
              logo={doc.branding.logo}
              showLogo={doc.blocks.businessLogo}
              onUpdateLogo={(logo) => setDoc((d) => updateBusinessLogo(d, logo))}
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
                <span>👁️ {t('livePreview')}</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1">
                    <span>{t('documentLanguage')}</span>
                    <select
                      data-testid="document-language-select"
                      aria-label={t('documentLanguage')}
                      value={documentLocale}
                      onChange={(event) => {
                        const nextLocale = event.target.value as Locale;
                        setDocumentLocale(nextLocale);
                        try {
                          window.localStorage.setItem(DOCUMENT_LOCALE_KEY, nextLocale);
                        } catch {
                          // The selection remains active for this session.
                        }
                      }}
                      className="rounded border border-slate-300 bg-white px-1 py-0.5 text-slate-700"
                    >
                      <option value="th">{t('documentLanguageThai')}</option>
                      <option value="en">{t('documentLanguageEnglish')}</option>
                    </select>
                  </label>
                  <button
                  type="button"
                  data-testid="btn-preview-print"
                  onClick={handlePrint}
                  disabled={!isValid}
                  title={!isValid ? t('printInvalid') : t('print')}
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold transition-colors ${
                    isValid
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>🖨️ {t('print')}</span>
                  </button>
                </div>
              </div>
              <NextIntlClientProvider locale={documentLocale} messages={localeMessages[documentLocale]}>
                <DocumentPreview document={doc} outputLocale={documentLocale} totals={totals} errors={errors} promptPay={resolvedPromptPay} />
              </NextIntlClientProvider>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Sticky Bar for compact view (<1024px, Hidden in print) */}
      <div className="no-print mobile-bottom-bar fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur-sm p-3 lg:hidden flex items-center justify-between shadow-lg">
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-500">{t('mobileNetTotal')}</span>
          <span className="font-mono text-sm font-black text-indigo-700" data-testid="mobile-net-payable">
            {formattedNetTotal ?? t('printInvalid')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            hidden
            type="button"
            data-testid="btn-mobile-export"
            onClick={handleExport}
            className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-2 text-xs font-bold text-slate-800 shadow-2xs active:scale-95 transition-all"
          >
            📤 {t('exportShort')}
          </button>
          <button
            type="button"
            data-testid="btn-mobile-print"
            onClick={handlePrint}
            disabled={!isValid}
            title={!isValid ? t('printInvalid') : t('print')}
            className={`rounded-lg px-3 py-2 text-xs font-bold shadow-sm transition-all ${
              isValid
                ? 'bg-slate-800 text-white hover:bg-slate-900 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            🖨️ {t('print')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab((t) => (t === 'editor' ? 'preview' : 'editor'))}
            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
          >
            {activeTab === 'editor' ? t('editPreviewToggle') : t('editEditorToggle')}
          </button>
        </div>
      </div>
    </div>
  );
}
