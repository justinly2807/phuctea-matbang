'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { vi } from './vi';
import { en } from './en';
import { zh } from './zh';
import { Translations } from './types';

export type Language = 'vi' | 'en' | 'zh';

const translations: Record<Language, Translations> = { vi, en, zh };

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'vi',
  setLang: () => {},
  t: vi,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('vi');

  useEffect(() => {
    // 1. Check saved preference first
    const saved = localStorage.getItem('phuctea_lang') as Language;
    if (saved && translations[saved]) {
      setLangState(saved);
      return;
    }

    // 2. Auto-detect from browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) {
      setLangState('zh');
    } else if (browserLang.startsWith('en')) {
      setLangState('en');
    }
    // Default: 'vi' (already set)
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('phuctea_lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
