'use client';

import { NextIntlClientProvider } from 'next-intl';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from '../../messages/en.json';
import th from '../../messages/th.json';

export type Locale = 'th' | 'en';
const COOKIE_NAME = 'doccraft_locale';
export const localeMessages = { th, en } as const;
type LocaleControl = { locale: Locale; setLocale: (locale: Locale) => void };
const LocaleContext = createContext<LocaleControl | null>(null);

function readLocaleCookie(): Locale | null {
  const match = document.cookie.match(/(?:^|;\s*)doccraft_locale=(th|en)(?:;|$)/);
  return match?.[1] === 'en' ? 'en' : match?.[1] === 'th' ? 'th' : null;
}

function persistLocale(locale: Locale) {
  document.cookie = `${COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  document.documentElement.lang = locale;
}

export function LocaleProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, setLocaleState] = useState<Locale>('th');

  useEffect(() => {
    const saved = readLocaleCookie() ?? 'th';
    persistLocale(saved);
    queueMicrotask(() => setLocaleState(saved));
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    persistLocale(nextLocale);
    setLocaleState(nextLocale);
  }, []);
  const control = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={control}>
      <NextIntlClientProvider locale={locale} messages={localeMessages[locale]}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useDocCraftLocale(): LocaleControl {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useDocCraftLocale must be used inside LocaleProvider');
  return value;
}
