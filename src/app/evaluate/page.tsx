'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CriteriaCard from '@/components/CriteriaCard';
import { CATEGORIES, getCriteriaByCategory } from '@/lib/criteria';
import { LocationInfo, EvaluationScores, getVerdict } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const STEP_LABELS = [
  ...CATEGORIES.map((c) => ({ icon: c.icon, name: c.name })),
  { icon: '📸', name: 'Hình ảnh & Video' },
];

export default function EvaluatePage() {
  const router = useRouter();
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [scores, setScores] = useState<EvaluationScores>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const totalSteps = 5;
  const totalAnswered = Object.keys(scores).length;

  useEffect(() => {
    const stored = sessionStorage.getItem('locationInfo');
    if (!stored) {
      router.push('/');
      return;
    }
    setLocationInfo(JSON.parse(stored));
  }, [router]);

  const handleSelect = (criterionId: number, score: number) => {
    setScores((prev) => ({ ...prev, [String(criterionId)]: score }));
  };

  const getCurrentCriteria = () => {
    if (currentStep <= 4) {
      return getCriteriaByCategory(currentStep);
    }
    return [];
  };

  const getCurrentStepAnswered = () => {
    if (currentStep > 4) return 0;
    const criteria = getCurrentCriteria();
    return criteria.filter((c) => scores[String(c.id)] !== undefined).length;
  };

  const isStepComplete = (step: number) => {
    if (step > 4) return true; // Upload step is always "complete" (optional)
    const criteria = getCriteriaByCategory(step);
    return criteria.every((c) => scores[String(c.id)] !== undefined);
  };

  const canProceed = () => {
    if (currentStep <= 4) return isStepComplete(currentStep);
    return true;
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - uploadedFiles.length;
    const newFiles = files.slice(0, remaining);

    // Validate sizes
    const valid = newFiles.filter((f) => {
      const isVideo = f.type.startsWith('video/');
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (f.size > maxSize) {
        alert(`${f.name} quá lớn (tối đa ${isVideo ? '50MB' : '10MB'})`);
        return false;
      }
      return true;
    });

    setUploadedFiles((prev) => [...prev, ...valid]);

    // Create previews
    valid.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setUploadPreviews((prev) => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadPreviews((prev) => [...prev, 'video']);
      }
    });

    // Reset input
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadToSupabase = async (): Promise<string[]> => {
    if (!isSupabaseConfigured || uploadedFiles.length === 0) return [];

    const urls: string[] = [];
    for (const file of uploadedFiles) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('survey-media')
        .upload(fileName, file);

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('survey-media')
          .getPublicUrl(fileName);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (totalAnswered < 20 || !locationInfo) return;

    setIsSubmitting(true);
    setUploading(uploadedFiles.length > 0);

    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const verdict = getVerdict(totalScore);

    // Upload media files
    let imageUrls: string[] = [];
    try {
      imageUrls = await uploadToSupabase();
    } catch {
      // Upload failure shouldn't block submission
    }

    // Full data with new columns (v2)
    const evaluationDataFull = {
      address_street: locationInfo.addressStreet,
      address_ward: locationInfo.addressWard || '',
      address_district: locationInfo.addressDistrict,
      address_city: locationInfo.addressCity,
      landlord_name: locationInfo.landlordName || null,
      landlord_phone: locationInfo.landlordPhone || null,
      rent_price: locationInfo.rentPrice || null,
      rent_unit: locationInfo.rentUnit || 'month',
      area_sqm: locationInfo.areaSqm || null,
      competitor_notes: locationInfo.competitorNotes || null,
      surveyor_name: locationInfo.surveyorName || null,
      survey_date: locationInfo.surveyDate || null,
      latitude: locationInfo.latitude || null,
      longitude: locationInfo.longitude || null,
      images: imageUrls,
      scores,
      total_score: totalScore,
      verdict,
    };

    // Fallback data without new columns (for DB that hasn't been migrated)
    const evaluationDataLegacy = {
      address_street: locationInfo.addressStreet,
      address_ward: locationInfo.addressWard || '',
      address_district: locationInfo.addressDistrict,
      address_city: locationInfo.addressCity,
      landlord_name: locationInfo.landlordName || null,
      landlord_phone: locationInfo.landlordPhone || null,
      rent_price: locationInfo.rentPrice || null,
      area_sqm: locationInfo.areaSqm || null,
      surveyor_name: locationInfo.surveyorName || null,
      survey_date: locationInfo.surveyDate || null,
      latitude: locationInfo.latitude || null,
      longitude: locationInfo.longitude || null,
      scores,
      total_score: totalScore,
      verdict,
    };

    try {
      if (!isSupabaseConfigured) throw new Error('Supabase not configured');

      // Try full insert first (with new columns)
      let insertResult = await supabase
        .from('evaluations')
        .insert(evaluationDataFull)
        .select('id')
        .single();

      // If fails (likely missing columns), retry with legacy columns
      if (insertResult.error) {
        console.warn('Full insert failed, retrying with legacy columns:', insertResult.error.message);
        insertResult = await supabase
          .from('evaluations')
          .insert(evaluationDataLegacy)
          .select('id')
          .single();
      }

      const { data, error } = insertResult;
      if (error) throw error;

      // Save to survey history
      const history = JSON.parse(localStorage.getItem('survey_history') || '[]');
      history.unshift({
        id: data.id,
        address: `${locationInfo.addressStreet}, ${locationInfo.addressDistrict}, ${locationInfo.addressCity}`,
        total_score: totalScore,
        verdict,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem('survey_history', JSON.stringify(history.slice(0, 50)));

      // Send email notification
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evaluationId: data.id,
            address: `${locationInfo.addressStreet}, ${locationInfo.addressWard}, ${locationInfo.addressDistrict}, ${locationInfo.addressCity}`,
            totalScore,
            verdict,
            surveyorName: locationInfo.surveyorName || 'Không rõ',
          }),
        });
      } catch {
        // Email failure shouldn't block the flow
      }

      sessionStorage.removeItem('locationInfo');
      router.push(`/result/${data.id}`);
    } catch (err) {
      console.error('Error saving evaluation:', err);
      // Fallback: save to localStorage if Supabase fails
      const fallbackId = 'local-' + Date.now();
      const evaluation = {
        id: fallbackId,
        ...evaluationDataFull,
        created_at: new Date().toISOString(),
      };

      const existing = JSON.parse(localStorage.getItem('evaluations') || '[]');
      existing.push(evaluation);
      localStorage.setItem('evaluations', JSON.stringify(existing));

      // Save to survey history
      const history = JSON.parse(localStorage.getItem('survey_history') || '[]');
      history.unshift({
        id: fallbackId,
        address: `${locationInfo.addressStreet}, ${locationInfo.addressDistrict}, ${locationInfo.addressCity}`,
        total_score: totalScore,
        verdict,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem('survey_history', JSON.stringify(history.slice(0, 50)));

      sessionStorage.removeItem('locationInfo');
      router.push(`/result/${fallbackId}`);
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  if (!locationInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentCriteria = getCurrentCriteria();
  const stepAnswered = getCurrentStepAnswered();

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div ref={topRef} />

      {/* Progress Bar */}
      <div className="sticky top-[52px] z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-dark">
              {STEP_LABELS[currentStep - 1].icon} {STEP_LABELS[currentStep - 1].name}
            </span>
            <span className="text-xs font-bold text-primary">
              Bước {currentStep}/{totalSteps}
              {currentStep <= 4 && ` — ${stepAnswered}/5`}
            </span>
          </div>

          {/* Step indicators */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
              const complete = step < currentStep || isStepComplete(step);
              const active = step === currentStep;
              return (
                <div
                  key={step}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    complete
                      ? 'bg-success'
                      : active
                      ? 'bg-primary'
                      : 'bg-gray-200'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Location Summary */}
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-2">
          <span className="text-lg">📍</span>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Đang khảo sát</p>
            <p className="text-sm font-medium text-dark truncate">
              {locationInfo.addressStreet}, {locationInfo.addressWard}, {locationInfo.addressDistrict}, {locationInfo.addressCity}
            </p>
          </div>
        </div>
      </div>

      {/* Criteria (Steps 1-4) */}
      {currentStep <= 4 && (
        <div className="max-w-4xl mx-auto px-4 pb-28 space-y-3">
          {currentCriteria.map((criterion) => (
            <CriteriaCard
              key={criterion.id}
              criterion={criterion}
              selectedScore={scores[String(criterion.id)]}
              onSelect={handleSelect}
              index={criterion.id}
            />
          ))}
        </div>
      )}

      {/* Upload Step (Step 5) */}
      {currentStep === 5 && (
        <div className="max-w-4xl mx-auto px-4 pb-28 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-dark mb-1">📸 Hình ảnh & Video mặt bằng</h3>
            <p className="text-xs text-gray-400 italic mb-4">
              Chụp ảnh mặt tiền, bên trong, khu vực xung quanh để báo cáo chi tiết hơn. Bước này không bắt buộc.
            </p>

            {/* Upload area */}
            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploadedFiles.length >= 10}
              />
              <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500 font-medium">
                {uploadedFiles.length >= 10 ? 'Đã đạt giới hạn 10 file' : 'Nhấn để chọn ảnh hoặc video'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Ảnh tối đa 10MB, video tối đa 50MB. Tối đa 10 file.</p>
            </label>

            {/* Preview grid */}
            {uploadPreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
                {uploadPreviews.map((preview, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    {preview === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <p className="text-[10px] text-white/50 mt-1">{uploadedFiles[i]?.name.slice(-15)}</p>
                        </div>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-danger transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <p className="text-xs text-gray-400 mt-2 text-center">{uploadedFiles.length}/10 file đã chọn</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="max-w-4xl mx-auto flex gap-3">
          {/* Back button */}
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-4 rounded-xl font-bold text-sm border-2 border-gray-200 text-gray-500 hover:border-dark hover:text-dark transition-all"
            >
              Quay lại
            </button>
          )}

          {/* Next / Submit button */}
          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex-1 py-4 rounded-xl font-bold text-base transition-all ${
                canProceed()
                  ? 'bg-primary hover:bg-primary-dark text-dark shadow-lg hover:shadow-xl active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {canProceed()
                ? 'Tiếp tục'
                : `Còn ${5 - stepAnswered} tiêu chí chưa đánh giá`}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-4 rounded-xl font-bold text-base bg-primary hover:bg-primary-dark text-dark shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                  {uploading ? 'Đang tải ảnh...' : 'Đang xử lý...'}
                </span>
              ) : (
                'Xem kết quả đánh giá'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
