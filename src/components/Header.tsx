'use client';

import Link from 'next/link';

export default function Header() {
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
            <p className="text-xs text-gray-400 leading-tight">Khảo Sát Mặt Bằng</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
