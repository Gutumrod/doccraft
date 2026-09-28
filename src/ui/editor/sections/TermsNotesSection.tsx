'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { BlockVisibility } from '../../../domain/document/types';

interface TermsNotesSectionProps {
  terms?: string;
  notes?: string;
  blocks: BlockVisibility;
  onUpdateTermsNotes: (patch: { terms?: string; notes?: string }) => void;
}

export function TermsNotesSection({
  terms,
  notes,
  blocks,
  onUpdateTermsNotes,
}: TermsNotesSectionProps) {
  const t = useTranslations('terms');
  const section = useTranslations('section');
  const showTerms = blocks.terms;
  const showNotes = blocks.notes;
  const showSignatures = blocks.signatures;

  if (!showTerms && !showNotes && !showSignatures) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-xs text-slate-500 flex items-center justify-between">
        <span>{section('hidden', { section: section('terms') })}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <h2 className="text-base font-semibold text-slate-900">{t('heading')}</h2>

      {/* Terms & Conditions */}
      {showTerms && (
        <div>
          <label htmlFor="docTerms" className="mb-1 block text-xs font-medium text-slate-700">
            {t('terms')}
          </label>
          <textarea
            id="docTerms"
            data-testid="input-doc-terms"
            rows={3}
            value={terms || ''}
            onChange={(e) => onUpdateTermsNotes({ terms: e.target.value })}
            placeholder={t('termsPlaceholder')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      )}

      {/* Notes / Remarks */}
      {showNotes && (
        <div>
          <label htmlFor="docNotes" className="mb-1 block text-xs font-medium text-slate-700">
            {t('notes')}
          </label>
          <textarea
            id="docNotes"
            data-testid="input-doc-notes"
            rows={2}
            value={notes || ''}
            onChange={(e) => onUpdateTermsNotes({ notes: e.target.value })}
            placeholder={t('notesPlaceholder')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      )}

      {/* Signatures status note */}
      {showSignatures && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600 flex items-center justify-between">
          <span>✍️ {t('signature')} <strong>{t('enabled')}</strong> {t('previewHint')}</span>
        </div>
      )}
    </div>
  );
}
