/* eslint-disable @next/next/no-img-element -- Canonical business logos are client-processed data URLs and must render unchanged. */
'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessLogo } from '../../../domain/document/types';
import type { BusinessProfile } from '../../../domain/tax/types';
import { processBusinessLogoFile } from '../../../image/business-logo';

interface BusinessSectionProps {
  business: BusinessProfile;
  onUpdateBusiness: (patch: Partial<BusinessProfile>) => void;
  logo?: BusinessLogo;
  showLogo: boolean;
  onUpdateLogo: (logo: BusinessLogo | undefined) => void;
  isVisible: boolean;
}

export function BusinessSection({
  business,
  onUpdateBusiness,
  logo,
  showLogo,
  onUpdateLogo,
  isVisible,
}: BusinessSectionProps) {
  const t = useTranslations('business');
  const section = useTranslations('section');
  const [processing, setProcessing] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  if (!isVisible) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-xs text-slate-500 flex items-center justify-between">
        <span>{section('hidden', { section: section('business') })}</span>
      </div>
    );
  }

  const clearLogoError = () => setLogoError(null);

  const handleLogoFile = async (file?: File) => {
    if (!file) return;
    clearLogoError();
    setProcessing(true);
    try {
      const processed = await processBusinessLogoFile(file);
      // Invariant: only replace the accepted logo after a successful, validated
      // encode; a failed replacement keeps the previously accepted logo.
      onUpdateLogo(processed);
    } catch (error) {
      setLogoError(error instanceof Error ? error.message : t('logoFailed'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{t('heading')}</h2>

      {/* Business Logo */}
      {showLogo && (
        <div className="mb-4 rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-600" data-testid="business-logo-editor">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {logo ? (
              <img
                src={logo.dataUrl}
                alt={t('logoAlt')}
                data-testid="business-logo-editor-preview"
                className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 bg-white object-contain"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-2xl text-slate-400">🏷️</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-800">{t('logo')}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">{t('logoHint')}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className={`inline-flex cursor-pointer items-center rounded-md border px-2.5 py-1.5 font-semibold transition-colors ${processing ? 'cursor-wait border-slate-200 bg-slate-100 text-slate-400' : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                  {processing ? t('processing') : logo ? t('changeLogo') : t('uploadLogo')}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    data-testid="input-business-logo"
                    disabled={processing}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      void handleLogoFile(file);
                    }}
                    className="sr-only"
                  />
                </label>
                {logo && (
                  <button
                    type="button"
                    data-testid="btn-remove-business-logo"
                    onClick={() => {
                      onUpdateLogo(undefined);
                      clearLogoError();
                    }}
                    className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    {t('removeLogo')}
                  </button>
                )}
              </div>
              {logoError && <div data-testid="business-logo-error" className="mt-2 rounded-md bg-rose-50 px-2 py-1.5 text-[11px] font-medium text-rose-700">{logoError}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Entity Type & VAT Status */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
            {t('entityType')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              data-testid="business-entity-individual"
              onClick={() => onUpdateBusiness({ entityType: 'individual' })}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                business.entityType === 'individual'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('individual')}
            </button>
            <button
              type="button"
              data-testid="business-entity-juristic"
              onClick={() => onUpdateBusiness({ entityType: 'juristic_person' })}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                business.entityType === 'juristic_person'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('juristic')}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
            {t('vatStatus')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              data-testid="business-vat-not-registered"
              onClick={() => onUpdateBusiness({ vatStatus: 'not_registered' })}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                business.vatStatus === 'not_registered'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('notRegistered')}
            </button>
            <button
              type="button"
              data-testid="business-vat-registered"
              onClick={() => onUpdateBusiness({ vatStatus: 'registered' })}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                business.vatStatus === 'registered'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('registered')}
            </button>
          </div>
        </div>
      </div>

      {/* Display Name & Tax ID */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bizDisplayName" className="mb-1 block text-xs font-medium text-slate-700">
            {t('nameLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id="bizDisplayName"
            data-testid="input-biz-name"
            type="text"
            value={business.displayName}
            onChange={(e) => onUpdateBusiness({ displayName: e.target.value })}
            placeholder={t('namePlaceholder')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="bizTaxId" className="mb-1 block text-xs font-medium text-slate-700">
            {t('taxId')}
          </label>
          <input
            id="bizTaxId"
            data-testid="input-biz-taxid"
            type="text"
            maxLength={13}
            value={business.taxId || ''}
            onChange={(e) => onUpdateBusiness({ taxId: e.target.value.replace(/\D/g, '') })}
            placeholder="0105550000000"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Address */}
      <div className="mb-4">
        <label htmlFor="bizAddress" className="mb-1 block text-xs font-medium text-slate-700">
          {t('addressLabel')} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="bizAddress"
          data-testid="input-biz-address"
          rows={2}
          value={business.address}
          onChange={(e) => onUpdateBusiness({ address: e.target.value })}
          placeholder={t('addressPlaceholder')}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* Branch Type & Number */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            {t('branchName')}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="biz-branch-headoffice"
              onClick={() =>
                onUpdateBusiness(
                  business.branchType === 'head_office'
                    ? { branchType: undefined, branchNumber: '' }
                    : { branchType: 'head_office', branchNumber: '' },
                )
              }
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                business.branchType === 'head_office'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('headOffice')}
            </button>
            <button
              type="button"
              data-testid="biz-branch-subbranch"
              onClick={() =>
                onUpdateBusiness(
                  business.branchType === 'branch'
                    ? { branchType: undefined, branchNumber: '' }
                    : { branchType: 'branch', branchNumber: business.branchNumber || '' },
                )
              }
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                business.branchType === 'branch'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('branch')}
            </button>
          </div>
        </div>

        {business.branchType === 'branch' && (
          <div>
            <label htmlFor="bizBranchNumber" className="mb-1 block text-xs font-medium text-slate-700">
              {t('branchNumber')} <span className="text-red-500">*</span>
            </label>
            <input
              id="bizBranchNumber"
              data-testid="input-biz-branch-number"
              type="text"
              maxLength={5}
              value={business.branchNumber || ''}
              onChange={(e) => onUpdateBusiness({ branchNumber: e.target.value })}
              placeholder="00001"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
