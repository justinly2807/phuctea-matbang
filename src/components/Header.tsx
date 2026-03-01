'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-dark text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://lh3.googleusercontent.com/sitesv/APaQ0STQDCdu2oy81vSK9v1heOEhSx4gEdzdb71Ig8Te1PHvhnzFaMiBhSFkPZRD4tPrKD3AVZXaGPg55-R2GNBUtUW7A0Ax6LcS4iI0TJhEh9mpbWK5hysXs5iFacHDkLSt35ygtEkIqV8-oigJyd0DVIiUVEzvE6x3r3n9W7qJlox2DAKSdUo905-iaYgyG85fAhCdZ_5vT3PZvWjhR7Q4IrNnBEBB8SLBXFfR=w1280"
            alt="Phúc Tea Logo"
            className="h-10 w-10 rounded-full object-cover bg-primary"
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
