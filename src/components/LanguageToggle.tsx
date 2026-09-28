'use client';

import { useTranslations } from 'next-intl';
import { useDocCraftLocale } from '../i18n/locale-provider';

export function LanguageToggle() {
  const t = useTranslations('app');
  const { locale, setLocale } = useDocCraftLocale();
  const nextLocale = locale === 'th' ? 'en' : 'th';
  return (
    <button
      type="button"
      data-testid="language-toggle"
      aria-label={t('switchLanguage')}
      onClick={() => setLocale(nextLocale)}
      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
    >
      {locale === 'th' ? 'EN' : 'ไทย'}
    </button>
  );
}
