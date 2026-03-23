'use client';

import Link from 'next/link';
import { useLanguage, Language } from '@/lib/i18n';

const LANG_OPTIONS: { code: Language; label: string }[] = [
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中' },
];

export default function Header() {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="bg-dark text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Phúc Tea Logo"
            className="h-10 w-10 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold leading-tight">
              <span className="text-primary">Phúc Tea</span>
            </h1>
            <p className="text-xs text-gray-400 leading-tight">{t.header.subtitle}</p>
          </div>
        </Link>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              onClick={() => setLang(opt.code)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                lang === opt.code
                  ? 'bg-primary text-dark shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
