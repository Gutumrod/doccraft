'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { BlockVisibility } from '../../domain/document/types';

interface BlockVisibilityControlsProps {
  blocks: BlockVisibility;
  onChange: (block: keyof BlockVisibility, visible: boolean) => void;
}

const BLOCK_CONFIGS: { key: keyof BlockVisibility }[] = [
  { key: 'business' },
  { key: 'businessLogo' },
  { key: 'customer' },
  { key: 'items' },
  { key: 'itemImages' },
  { key: 'adjustments' },
  { key: 'payment' },
  { key: 'terms' },
  { key: 'notes' },
  { key: 'signatures' },
];

export function BlockVisibilityControls({ blocks, onChange }: BlockVisibilityControlsProps) {
  const t = useTranslations('blockVisibility');
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{t('heading')}</h3>
          <p className="text-xs text-slate-500">{t('description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3">
        {BLOCK_CONFIGS.map(({ key }) => {
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
              <span className="truncate">{t(key)}</span>
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
