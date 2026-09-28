'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { CustomerProfile } from '../../../domain/document/types';

interface CustomerSectionProps {
  customer: CustomerProfile;
  onUpdateCustomer: (patch: Partial<CustomerProfile>) => void;
  isVisible: boolean;
}

export function CustomerSection({ customer, onUpdateCustomer, isVisible }: CustomerSectionProps) {
  const t = useTranslations('customer');
  const section = useTranslations('section');
  if (!isVisible) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-xs text-slate-500 flex items-center justify-between">
        <span>{section('hidden', { section: section('customer') })}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{t('heading')}</h2>

      {/* Customer Name & Tax ID */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="custDisplayName" className="mb-1 block text-xs font-medium text-slate-700">
            {t('nameLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id="custDisplayName"
            data-testid="input-cust-name"
            type="text"
            value={customer.displayName}
            onChange={(e) => onUpdateCustomer({ displayName: e.target.value })}
            placeholder={t('namePlaceholder')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="custTaxId" className="mb-1 block text-xs font-medium text-slate-700">
            {t('taxId')}
          </label>
          <input
            id="custTaxId"
            data-testid="input-cust-taxid"
            type="text"
            maxLength={13}
            value={customer.taxId || ''}
            onChange={(e) => onUpdateCustomer({ taxId: e.target.value.replace(/\D/g, '') })}
            placeholder="0105550000000"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Address */}
      <div className="mb-4">
        <label htmlFor="custAddress" className="mb-1 block text-xs font-medium text-slate-700">
          {t('addressLabel')} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="custAddress"
          data-testid="input-cust-address"
          rows={2}
          value={customer.address}
          onChange={(e) => onUpdateCustomer({ address: e.target.value })}
          placeholder={t('addressPlaceholder')}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* Branch Information */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            {t('branchName')}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="cust-branch-headoffice"
              onClick={() =>
                onUpdateCustomer(
                  customer.branchType === 'head_office'
                    ? { branchType: undefined, branchNumber: '' }
                    : { branchType: 'head_office', branchNumber: '' },
                )
              }
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                customer.branchType === 'head_office'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('headOffice')}
            </button>
            <button
              type="button"
              data-testid="cust-branch-subbranch"
              onClick={() =>
                onUpdateCustomer(
                  customer.branchType === 'branch'
                    ? { branchType: undefined, branchNumber: '' }
                    : { branchType: 'branch', branchNumber: customer.branchNumber || '' },
                )
              }
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                customer.branchType === 'branch'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('branch')}
            </button>
          </div>
        </div>

        {customer.branchType === 'branch' && (
          <div>
            <label htmlFor="custBranchNumber" className="mb-1 block text-xs font-medium text-slate-700">
              {t('branchNumber')}
            </label>
            <input
              id="custBranchNumber"
              data-testid="input-cust-branch-number"
              type="text"
              maxLength={5}
              value={customer.branchNumber || ''}
              onChange={(e) => onUpdateCustomer({ branchNumber: e.target.value })}
              placeholder="00001"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
