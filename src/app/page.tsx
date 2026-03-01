'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationModal from '@/components/LocationModal';
import { LocationInfo } from '@/types';

export default function Home() {
  const [showModal, setShowModal] = useState(true);
  const router = useRouter();

  const handleSubmit = (info: LocationInfo) => {
    sessionStorage.setItem('locationInfo', JSON.stringify(info));
    setShowModal(false);
    router.push('/evaluate');
  };

  return (
    <main className="min-h-screen bg-dark flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://lh3.googleusercontent.com/sitesv/APaQ0STQDCdu2oy81vSK9v1heOEhSx4gEdzdb71Ig8Te1PHvhnzFaMiBhSFkPZRD4tPrKD3AVZXaGPg55-R2GNBUtUW7A0Ax6LcS4iI0TJhEh9mpbWK5hysXs5iFacHDkLSt35ygtEkIqV8-oigJyd0DVIiUVEzvE6x3r3n9W7qJlox2DAKSdUo905-iaYgyG85fAhCdZ_5vT3PZvWjhR7Q4IrNnBEBB8SLBXFfR=w1280"
          alt="Phúc Tea Logo"
          className="w-24 h-24 mx-auto rounded-full object-cover bg-primary shadow-xl shadow-primary/30"
        />
        <div>
          <h1 className="text-3xl font-bold text-primary">Phúc Tea</h1>
          <p className="text-gray-400 mt-2 text-sm">Hệ thống đánh giá mặt bằng nhượng quyền</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary-dark text-dark font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl text-base"
        >
          Bắt đầu khảo sát
        </button>
      </div>

      {showModal && <LocationModal onSubmit={handleSubmit} />}
    </main>
  );
}
