'use client';

import React from 'react';
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
  const showTerms = blocks.terms;
  const showNotes = blocks.notes;
  const showSignatures = blocks.signatures;

  if (!showTerms && !showNotes && !showSignatures) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-xs text-slate-500 flex items-center justify-between">
        <span>เงื่อนไข หมายเหตุ และลายมือชื่อ (ซ่อนอยู่ทั้งหมด)</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <h2 className="text-base font-semibold text-slate-900">7. เงื่อนไขและหมายเหตุ (Terms & Notes)</h2>

      {/* Terms & Conditions */}
      {showTerms && (
        <div>
          <label htmlFor="docTerms" className="mb-1 block text-xs font-medium text-slate-700">
            เงื่อนไขและข้อตกลง (Terms & Conditions)
          </label>
          <textarea
            id="docTerms"
            data-testid="input-doc-terms"
            rows={3}
            value={terms || ''}
            onChange={(e) => onUpdateTermsNotes({ terms: e.target.value })}
            placeholder="1. กำหนดยืนราคา 30 วัน&#10;2. ส่งมอบงานภายใน 15 วันหลังลงนาม"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      )}

      {/* Notes / Remarks */}
      {showNotes && (
        <div>
          <label htmlFor="docNotes" className="mb-1 block text-xs font-medium text-slate-700">
            หมายเหตุท้ายเอกสาร (Notes / Remarks)
          </label>
          <textarea
            id="docNotes"
            data-testid="input-doc-notes"
            rows={2}
            value={notes || ''}
            onChange={(e) => onUpdateTermsNotes({ notes: e.target.value })}
            placeholder="ข้อความขอบคุณ หรือข้อมูลแจ้งเตือนเพิ่มเติม"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      )}

      {/* Signatures status note */}
      {showSignatures && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600 flex items-center justify-between">
          <span>✍️ ช่องลงลายมือชื่อผู้ออกเอกสารและผู้รับมอบงาน: <strong>เปิดใช้งาน</strong> (จะแสดงผลในพรีวิว)</span>
        </div>
      )}
    </div>
  );
}
