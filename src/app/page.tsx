'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationModal from '@/components/LocationModal';
import { LocationInfo } from '@/types';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleSubmit = (info: LocationInfo) => {
    sessionStorage.setItem('locationInfo', JSON.stringify(info));
    setShowModal(false);
    router.push('/evaluate');
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md mx-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Phúc Tea Logo"
          className="w-32 h-32 mx-auto object-contain drop-shadow-2xl"
        />
        <p className="text-gray-500 text-sm font-medium">Hệ thống đánh giá mặt bằng nhượng quyền</p>

        {/* Compelling copy */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-left space-y-3 shadow-sm">
          <p className="text-dark font-bold text-base">
            🏆 Chọn đúng mặt bằng = Thành công 50%
          </p>
          <p className="text-gray-500 text-sm leading-relaxed">
            Một vị trí tốt có thể <span className="text-dark font-semibold">tăng mức độ thành công lên 50%</span> và
            giúp tiết kiệm <span className="text-dark font-semibold">hàng trăm triệu đồng</span> chi phí vận hành.
            Hệ thống khảo sát 20 tiêu chí của Phúc Tea giúp anh/chị đánh giá mặt bằng một cách khoa học,
            chính xác và chuyên nghiệp.
          </p>
          <div className="flex items-center gap-4 pt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-success"></span>
              20 tiêu chí đánh giá
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
              Kết quả tức thì
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-info"></span>
              Xuất PDF
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-primary hover:bg-primary-dark text-dark font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] text-base"
        >
          🚀 Bắt đầu khảo sát ngay
        </button>
      </div>

      {showModal && <LocationModal onSubmit={handleSubmit} />}
    </main>
  );
}
