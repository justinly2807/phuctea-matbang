'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { LocationInfo } from '@/types';
import { PROVINCES } from '@/lib/provinces';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

interface LocationModalProps {
  onSubmit: (info: LocationInfo) => void;
}

// Format number with dots: 9000000 → 9.000.000
function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Format phone: 0901234567 → 0901 234 567
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
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
    rentUnit: 'month',
    areaSqm: '',
    competitorNotes: '',
    surveyorName: '',
    surveyDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [gpsLoading, setGpsLoading] = useState(false);

  const updateField = (field: keyof LocationInfo, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ GPS');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setForm((prev) => ({ ...prev, latitude, longitude }));

        // Reverse geocode with Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi`
          );
          const data = await res.json();
          if (data.address) {
            const addr = data.address;
            const district = addr.city_district || addr.suburb || addr.county || '';
            const city = addr.city || addr.state || '';
            if (district && !form.addressDistrict) {
              setForm((prev) => ({ ...prev, addressDistrict: district }));
            }
            if (city && !form.addressCity) {
              const matched = PROVINCES.find(
                (p) => city.includes(p) || p.includes(city)
              );
              if (matched) {
                setForm((prev) => ({ ...prev, addressCity: matched }));
              }
            }
          }
        } catch {
          // Reverse geocode failure is OK
        }

        setGpsLoading(false);
      },
      (err) => {
        console.error('GPS error:', err);
        alert('Không thể lấy vị trí. Vui lòng cho phép truy cập GPS.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.addressStreet.trim()) newErrors.addressStreet = true;
    if (!form.addressDistrict.trim()) newErrors.addressDistrict = true;
    if (!form.addressCity.trim()) newErrors.addressCity = true;
    if (!(form.surveyorName || '').trim()) newErrors.surveyorName = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
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
              <p className="text-sm text-gray-300">Bộ tiêu chí đánh giá mặt bằng</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2 italic">
            Vui lòng nhập thông tin địa điểm mà bạn muốn khảo sát phía dưới.
          </p>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">

          {/* === Section 1: Địa chỉ === */}
          <h3 className="font-semibold text-dark flex items-center gap-2">
            <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-dark">1</span>
            Địa chỉ mặt bằng <span className="text-danger text-xs">*Bắt buộc</span>
          </h3>

          {/* GPS Button */}
          <button
            type="button"
            onClick={handleGPS}
            disabled={gpsLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-primary/50 text-primary-dark text-sm font-medium hover:bg-primary/5 transition disabled:opacity-50"
          >
            {gpsLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Đang lấy vị trí...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Lấy vị trí hiện tại (GPS)
              </>
            )}
          </button>

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
            <input
              type="text"
              placeholder="Phường / Xã (không bắt buộc)"
              value={form.addressWard}
              onChange={(e) => updateField('addressWard', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
            />
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
                <select
                  value={form.addressCity}
                  onChange={(e) => updateField('addressCity', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.addressCity ? 'border-danger bg-red-50' : 'border-gray-200'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm ${!form.addressCity ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  <option value="" disabled>Tỉnh / TP *</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
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

          {/* === Section 2: Người khảo sát (bắt buộc) === */}
          <h3 className="font-semibold text-dark flex items-center gap-2 pt-2">
            <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-dark">2</span>
            Người khảo sát <span className="text-danger text-xs">*Bắt buộc</span>
          </h3>
          <div>
            <input
              type="text"
              placeholder="Họ và tên người khảo sát *"
              value={form.surveyorName}
              onChange={(e) => updateField('surveyorName', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${errors.surveyorName ? 'border-danger bg-red-50' : 'border-gray-200'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm`}
            />
            {errors.surveyorName && <p className="text-danger text-xs mt-1">Vui lòng nhập tên người khảo sát</p>}
          </div>

          {/* === Section 3: Thông tin bổ sung (luôn hiện, tùy chọn) === */}
          <h3 className="font-semibold text-dark flex items-center gap-2 pt-2">
            <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">3</span>
            Thông tin bổ sung <span className="text-xs text-gray-400 font-normal">(tùy chọn)</span>
          </h3>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Tên chủ nhà"
              value={form.landlordName}
              onChange={(e) => updateField('landlordName', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
            />
            <input
              type="tel"
              placeholder="SĐT chủ nhà (VD: 0901 234 567)"
              value={formatPhone(form.landlordPhone || '')}
              onChange={(e) => updateField('landlordPhone', e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Giá thuê (VNĐ)"
                  value={form.rentPrice ? formatNumber(form.rentPrice) : ''}
                  onChange={(e) => updateField('rentPrice', e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
                />
              </div>
              <select
                value={form.rentUnit || 'month'}
                onChange={(e) => updateField('rentUnit', e.target.value)}
                className="px-3 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm text-gray-700 bg-gray-50"
              >
                <option value="month">/tháng</option>
                <option value="year">/năm</option>
              </select>
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Diện tích"
                value={form.areaSqm}
                onChange={(e) => updateField('areaSqm', e.target.value.replace(/[^\d.]/g, ''))}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">m²</span>
            </div>
            <input
              type="date"
              value={form.surveyDate}
              onChange={(e) => updateField('surveyDate', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
            />

            {/* Competitor Notes */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Ghi chú đối thủ cạnh tranh</label>
              <textarea
                placeholder="VD: Có quán Gong Cha cách 50m, Highland Coffee đối diện, khu vực có 3 quán trà sữa khác..."
                value={form.competitorNotes || ''}
                onChange={(e) => updateField('competitorNotes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm resize-none"
              />
            </div>
          </div>

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
