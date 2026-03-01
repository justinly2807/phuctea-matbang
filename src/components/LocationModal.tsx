'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { LocationInfo } from '@/types';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

interface LocationModalProps {
  onSubmit: (info: LocationInfo) => void;
}

export default function LocationModal({ onSubmit }: LocationModalProps) {
  const [form, setForm] = useState<LocationInfo>({
    addressStreet: '',
    addressWard: '',
    addressDistrict: '',
    addressCity: '',
    landlordName: '',
    landlordPhone: '',
    rentPrice: '',
    areaSqm: '',
    surveyorName: '',
    surveyDate: new Date().toISOString().split('T')[0],
  });

  const [showOptional, setShowOptional] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const updateField = (field: keyof LocationInfo, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.addressStreet.trim()) newErrors.addressStreet = true;
    if (!form.addressWard.trim()) newErrors.addressWard = true;
    if (!form.addressDistrict.trim()) newErrors.addressDistrict = true;
    if (!form.addressCity.trim()) newErrors.addressCity = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(form);
  };

  const fullAddress = [form.addressStreet, form.addressWard, form.addressDistrict, form.addressCity]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-dark text-white p-5 sm:rounded-t-2xl rounded-t-2xl">
          <div className="flex items-center gap-3 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Phúc Tea"
              className="h-12 w-12 object-contain"
            />
            <div>
              <h2 className="text-xl font-bold text-primary">Phúc Tea</h2>
              <p className="text-sm text-gray-300">Khảo Sát Mặt Bằng</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Vui lòng nhập thông tin địa điểm bạn muốn khảo sát
          </p>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <h3 className="font-semibold text-dark flex items-center gap-2">
            <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-dark">1</span>
            Địa chỉ mặt bằng <span className="text-danger text-xs">*Bắt buộc</span>
          </h3>

          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Số nhà, tên đường *"
                value={form.addressStreet}
                onChange={(e) => updateField('addressStreet', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${errors.addressStreet ? 'border-danger bg-red-50' : 'border-gray-200'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm`}
              />
              {errors.addressStreet && <p className="text-danger text-xs mt-1">Vui lòng nhập số nhà, tên đường</p>}
            </div>
            <div>
              <input
                type="text"
                placeholder="Phường / Xã *"
                value={form.addressWard}
                onChange={(e) => updateField('addressWard', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${errors.addressWard ? 'border-danger bg-red-50' : 'border-gray-200'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm`}
              />
              {errors.addressWard && <p className="text-danger text-xs mt-1">Vui lòng nhập phường/xã</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Quận / Huyện *"
                  value={form.addressDistrict}
                  onChange={(e) => updateField('addressDistrict', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.addressDistrict ? 'border-danger bg-red-50' : 'border-gray-200'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm`}
                />
                {errors.addressDistrict && <p className="text-danger text-xs mt-1">Bắt buộc</p>}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Tỉnh / Thành phố *"
                  value={form.addressCity}
                  onChange={(e) => updateField('addressCity', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.addressCity ? 'border-danger bg-red-50' : 'border-gray-200'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm`}
                />
                {errors.addressCity && <p className="text-danger text-xs mt-1">Bắt buộc</p>}
              </div>
            </div>
          </div>

          {/* Map */}
          <MapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            address={fullAddress}
            onLocationChange={(lat, lng) => {
              setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
            }}
          />

          {/* Optional Fields Toggle */}
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="w-full flex items-center justify-between py-3 text-sm text-gray-500 hover:text-dark transition"
          >
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">2</span>
              Thông tin bổ sung (tùy chọn)
            </span>
            <svg className={`w-5 h-5 transition-transform ${showOptional ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showOptional && (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <input
                type="text"
                placeholder="Tên chủ nhà"
                value={form.landlordName}
                onChange={(e) => updateField('landlordName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
              />
              <input
                type="tel"
                placeholder="SĐT chủ nhà"
                value={form.landlordPhone}
                onChange={(e) => updateField('landlordPhone', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Giá thuê (VNĐ/tháng)"
                  value={form.rentPrice}
                  onChange={(e) => updateField('rentPrice', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
                />
                <input
                  type="text"
                  placeholder="Diện tích (m²)"
                  value={form.areaSqm}
                  onChange={(e) => updateField('areaSqm', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Người khảo sát"
                  value={form.surveyorName}
                  onChange={(e) => updateField('surveyorName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
                />
                <input
                  type="date"
                  value={form.surveyDate}
                  onChange={(e) => updateField('surveyDate', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full bg-primary hover:bg-primary-dark text-dark font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] text-base"
          >
            Bắt đầu khảo sát
          </button>
        </div>
      </div>
    </div>
  );
}
