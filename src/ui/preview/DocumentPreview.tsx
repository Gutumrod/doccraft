/* eslint-disable @next/next/no-img-element -- Canonical item images are client-processed data URLs and must render unchanged. */
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import type { Locale } from '../../i18n/locale-provider';
import type { CalculationTotals } from '../../domain/calculation/types';
import type { DocCraftDocument } from '../../domain/document/types';
import type { ResolvedPromptPay } from '../../domain/promptpay/types';
import type { ValidationIssue } from '../../domain/validation/result';

interface DocumentPreviewProps {
  document: DocCraftDocument;
  outputLocale: Locale;
  totals?: CalculationTotals;
  errors?: ValidationIssue[];
  promptPay?: ResolvedPromptPay;
}

export function DocumentPreview({ document, outputLocale, totals, errors, promptPay }: DocumentPreviewProps) {
  const t = useTranslations('documentOutput');
  const numberLocale = outputLocale === 'th' ? 'th-TH' : 'en-US';
  const { blocks, business, customer, items } = document;
  const lineMap = new Map(totals?.lines.map((l) => [l.id, l]));

  return (
    <div
      data-testid="document-preview-container" data-document-output="true"
      className="a4-document-sheet rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 md:p-10 shadow-sm transition-all text-slate-900 font-sans text-xs leading-normal"
    >
      {/* Validation alert in preview (screen only, hidden in print) */}
      {errors && errors.length > 0 && (
        <div
          data-testid="preview-validation-errors"
          className="no-print mb-6 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-900"
        >
          <div className="flex items-center gap-2 font-bold text-rose-800 mb-1">
            <span>⚠️</span> {t('errorSummary', { count: errors.length })}
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-rose-700">
            {errors.map((err, i) => (
              <li key={i}>
                {err.message} <span className="text-[10px] text-rose-500 font-mono">({err.path})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Header Block: Business Info + Document Meta */}
      <div className="print-document-header print-avoid-break mb-8 flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
        {/* Business Info + Logo */}
        {blocks.business ? (
          <div data-testid="preview-block-business" className="space-y-1.5 max-w-sm sm:max-w-md break-words">
            {blocks.businessLogo && document.branding.logo && (
              <img
                src={document.branding.logo.dataUrl}
                alt={t('businessLogoAlt', { name: business.displayName || t('businessNamePlaceholder') })}
                data-testid="preview-business-logo"
                className="business-logo-preview mb-2 h-16 max-w-40 object-contain print:mb-1 print:object-contain"
              />
            )}
            <h1 className="text-xl font-bold tracking-tight text-slate-950 break-words">
              {business.displayName || t('businessNamePlaceholder')}
            </h1>
            <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600 break-words">
              {business.address || t('addressPlaceholder')}
            </p>
            {(business.taxId || business.branchType) && (
              <div className="pt-1 text-[11px] text-slate-600 flex flex-wrap gap-x-2 gap-y-0.5">
                {business.taxId && (
                  <span>
                    {t('taxId')}:  <span className="font-mono font-semibold text-slate-900">{business.taxId}</span>
                  </span>
                )}
                {business.branchType && (
                  <span>
                    ({business.branchType === 'head_office' ? t('headOffice') : t('branch', { number: business.branchNumber || '' })})
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic no-print">{t('hiddenIssuer')}</div>
        )}

        {/* Document Meta */}
        <div className="text-left sm:text-right shrink-0">
          <div className="inline-block rounded-lg bg-indigo-50/90 px-4 py-2 text-indigo-950 border border-indigo-200">
            <span className="block text-base font-black tracking-wide text-indigo-900">
              {t(document.documentType)}
            </span>
            <span className="block text-[10px] font-bold tracking-wider text-indigo-700 uppercase">
              {t(document.documentType)}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-xs text-slate-700">
            <div className="flex justify-between sm:justify-end gap-3">
              <span className="text-slate-500">{t('docNumber')}</span>
              <span className="font-mono font-bold text-slate-950" data-testid="preview-doc-number">
                {document.documentNumber}
              </span>
            </div>
            <div className="flex justify-between sm:justify-end gap-3">
              <span className="text-slate-500">{t('issueDate')}</span>
              <span className="font-mono text-slate-950">{document.issueDate}</span>
            </div>
            {document.dueDate && (
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="text-slate-500">{t('dueDate')}</span>
                <span className="font-mono text-slate-950">{document.dueDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Info Block */}
      {blocks.customer && (
        <div data-testid="preview-block-customer" className="print-customer-card print-avoid-break mb-8 rounded-xl bg-slate-50/80 p-4 border border-slate-200 break-words">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            {t('customer')}
          </span>
          <div className="text-sm font-bold text-slate-950 break-words">
            {customer.displayName || t('customerNamePlaceholder')}
          </div>
          <div className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-700 break-words">
            {customer.address || t('addressPlaceholder')}
          </div>
          {(customer.taxId || customer.branchType) && (
            <div className="mt-2 text-[11px] text-slate-600 flex flex-wrap gap-x-2 gap-y-0.5">
              {customer.taxId && (
                <span>
                  {t('taxId')}:  <span className="font-mono font-semibold text-slate-900">{customer.taxId}</span>
                </span>
              )}
              {customer.branchType && (
                <span>
                  ({customer.branchType === 'head_office' ? t('headOffice') : t('branch', { number: customer.branchNumber || '' })})
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Items Table Block */}
      {blocks.items && (
        <div data-testid="preview-block-items" className="print-items-block mb-8 overflow-x-auto print:overflow-visible">
          <table className="print-items-table w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-100/70 text-slate-700 font-bold uppercase text-[11px]">
                <th className="py-2.5 px-2 w-10 text-center">#</th>
                <th className="py-2.5 px-3">{t('itemDescription')}</th>
                <th className="py-2.5 px-2 text-right w-18">{t('quantity')}</th>
                <th className="py-2.5 px-2 text-right w-24">{t('unitPrice')}</th>
                <th className="py-2.5 px-2 text-right w-20">{t('discount')}</th>
                <th className="py-2.5 px-3 text-right w-28">{t('amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => {
                const calcLine = lineMap.get(item.id);
                const discountText =
                  item.discount.mode === 'none'
                    ? '-'
                    : item.discount.mode === 'percent'
                      ? `${item.discount.value}%`
                      : `${item.discount.value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })} ${outputLocale === 'th' ? '฿' : 'THB'}`;

                return (
                  <tr key={item.id} className="print-avoid-break hover:bg-slate-50/50">
                    <td className="py-3 px-2 text-center text-slate-500 font-mono align-top">{idx + 1}</td>
                    <td className="py-3 px-3 align-top break-words">
                      <div className="font-medium text-slate-950 leading-relaxed break-words">{item.description}</div>
                      {blocks.itemImages && item.image && (
                        <img
                          src={item.image.dataUrl}
                          alt={t('itemImageAlt', { description: item.description || `${t('itemDescription')} ${idx + 1}` })}
                          data-testid={`preview-item-image-${item.id}`}
                          className="item-image-preview mt-2 max-h-24 max-w-32 rounded-md border border-slate-200 bg-white object-contain"
                        />
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-800 align-top">{item.quantity}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-800 align-top">
                      {item.unitPrice.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-600 align-top">{discountText}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-950 align-top">
                      {calcLine
                        ? calcLine.totalAmount.toLocaleString(numberLocale, { minimumFractionDigits: 2 })
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjustments & Totals Summary Block */}
      {blocks.adjustments && totals && (
        <div data-testid="preview-block-adjustments" className="print-adjustments-block print-avoid-break mb-8 flex flex-col sm:flex-row justify-end">
          <div className="print-adjustments-card w-full sm:w-84 space-y-2 rounded-xl bg-slate-50/80 p-4 border border-slate-200 text-xs">
            <div className="flex justify-between text-slate-700">
              <span>{t('subtotal')}</span>
              <span className="font-mono font-semibold text-slate-950">{totals.subtotal.toLocaleString(numberLocale, { minimumFractionDigits: 2 })} {outputLocale === 'th' ? '฿' : 'THB'}</span>
            </div>

            {totals.documentDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>{t('documentDiscount')}</span>
                <span className="font-mono font-semibold">-{totals.documentDiscountAmount.toLocaleString(numberLocale, { minimumFractionDigits: 2 })} {outputLocale === 'th' ? '฿' : 'THB'}</span>
              </div>
            )}

            {totals.documentDiscountAmount > 0 && (
              <div className="flex justify-between text-slate-700 border-t border-slate-200/80 pt-1">
                <span>{t('afterDiscount')}</span>
                <span className="font-mono font-semibold text-slate-950">{totals.amountAfterDiscount.toLocaleString(numberLocale, { minimumFractionDigits: 2 })} {outputLocale === 'th' ? '฿' : 'THB'}</span>
              </div>
            )}

            {totals.vatAmount > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>{t('vat')}</span>
                <span className="font-mono font-semibold text-slate-950">+{totals.vatAmount.toLocaleString(numberLocale, { minimumFractionDigits: 2 })} {outputLocale === 'th' ? '฿' : 'THB'}</span>
              </div>
            )}

            {totals.whtAmount > 0 && (
              <div className="flex justify-between text-amber-900">
                <span>{t('wht', { rate: totals.whtRatePercent })}</span>
                <span className="font-mono font-semibold">-{totals.whtAmount.toLocaleString(numberLocale, { minimumFractionDigits: 2 })} {outputLocale === 'th' ? '฿' : 'THB'}</span>
              </div>
            )}

            <div className="border-t-2 border-slate-300 pt-2 flex justify-between text-sm font-bold text-slate-950">
              <span>{t('netTotal')}</span>
              <span className="font-mono text-indigo-900">{totals.netPayable.toLocaleString(numberLocale, { minimumFractionDigits: 2 })} {outputLocale === 'th' ? '฿' : 'THB'}</span>
            </div>

            {totals.depositAmount > 0 && (
              <div className="flex justify-between text-slate-700 border-t border-dashed border-slate-300 pt-1.5">
                <span>{t('deposit')}</span>
                <span className="font-mono font-bold text-indigo-950">
                  {totals.depositAmount.toLocaleString(numberLocale, { minimumFractionDigits: 2 })} {outputLocale === 'th' ? '฿' : 'THB'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Block */}
      {blocks.payment && (document.payment.instructions || promptPay) && (
        <div data-testid="preview-block-payment" className="print-payment-card print-avoid-break mb-8 rounded-xl bg-slate-50/70 p-4 border border-slate-200 break-words">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            {t('paymentDetails')}
          </span>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {document.payment.instructions && (
              <p className="whitespace-pre-line text-xs text-slate-800 leading-relaxed font-mono break-words">
                {document.payment.instructions}
              </p>
            )}
            {promptPay && (
              <div data-testid="preview-promptpay-qr" className="shrink-0 rounded-lg border border-slate-200 bg-white p-3 text-center">
                <QRCodeSVG value={promptPay.payload} size={128} level="M" marginSize={1} title="PromptPay QR" />
                <div className="mt-2 text-[10px] font-bold text-slate-700">PromptPay</div>
                <div className="text-[9px] text-slate-500 font-mono">{promptPay.normalizedIdentifier}</div>
                {promptPay.amount !== undefined && (
                  <div className="mt-0.5 text-[10px] font-semibold text-slate-800">
                    {promptPay.amount.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {outputLocale === 'th' ? '฿' : 'THB'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terms & Notes */}
      <div className="print-terms-grid mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {blocks.terms && document.terms && (
          <div data-testid="preview-block-terms" className="print-terms-card print-avoid-break rounded-xl border border-slate-200 p-4 bg-slate-50/50 break-words">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {t('terms')}
            </span>
            <p className="whitespace-pre-line text-xs text-slate-700 leading-relaxed break-words">
              {document.terms}
            </p>
          </div>
        )}

        {blocks.notes && document.notes && (
          <div data-testid="preview-block-notes" className="print-terms-card print-avoid-break rounded-xl border border-slate-200 p-4 bg-slate-50/50 break-words">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {t('notes')}
            </span>
            <p className="whitespace-pre-line text-xs text-slate-700 leading-relaxed break-words">
              {document.notes}
            </p>
          </div>
        )}
      </div>

      {/* Signatures Block */}
      {blocks.signatures && (
        <div data-testid="preview-block-signatures" className="print-signatures-block print-avoid-break mt-8 border-t border-slate-200 pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
          <div>
            <div className="print-signature-line mx-auto mb-2 h-16 w-44 sm:w-52 border-b border-dashed border-slate-400"></div>
            <p className="font-semibold text-slate-900">{t('buyerSignature')}</p>
            <p className="text-[10px] text-slate-500">{t('date')}</p>
          </div>
          <div>
            <div className="print-signature-line mx-auto mb-2 h-16 w-44 sm:w-52 border-b border-dashed border-slate-400"></div>
            <p className="font-semibold text-slate-900">{t('issuerSignature')}</p>
            <p className="text-[10px] text-slate-500">{t('date')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
