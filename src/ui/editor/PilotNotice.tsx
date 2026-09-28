'use client';

import { useTranslations } from 'next-intl';

export function PilotNotice() {
  const t = useTranslations('pilot');
  return (
    <section
      data-testid="public-pilot-notice"
      className="no-print border-b border-amber-200 bg-amber-50/90 px-3 py-2.5 text-slate-800 sm:px-6"
      aria-label={t('aria')}
    >
      <div className="mx-auto max-w-7xl">
        <details className="group">
          <summary className="cursor-pointer list-none text-xs font-semibold sm:text-sm">
            <span className="mr-2 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-950">
              Public Pilot
            </span>
            {t('summary')}
            <span className="ml-1 text-amber-800 group-open:hidden">{t('details')}</span>
          </summary>

          <div className="mt-3 grid gap-3 text-xs leading-relaxed text-slate-700 md:grid-cols-2">
            <div>
              <h2 className="font-bold text-slate-900">{t('privacy')}</h2>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>{t('dataStored')}</li>
                <li>{t('dataLoss')}</li>
                <li>{t('noTelemetry')}</li>
                <li>{t('operationalLogs')}</li>
              </ul>
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{t('pilotLimits')}</h2>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>{t('promptPay')}</li>
                <li>{t('printing')}</li>
                <li>{t('notAdvice')}</li>
              </ul>
            </div>

            <p className="md:col-span-2">
              {t('support')}{' '}
              <a href="https://github.com/Gutumrod/doccraft/issues" target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-900">
                DocCraft GitHub Issues
              </a>
            </p>
            <p data-testid="legal-translation-status" className="md:col-span-2 text-slate-500">
              {t('termsUnavailable')}
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
