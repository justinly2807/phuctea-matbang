'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CriteriaCard from '@/components/CriteriaCard';
import { CATEGORIES, getCriteriaByCategory } from '@/lib/criteria';
import { LocationInfo, EvaluationScores, getVerdict } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function EvaluatePage() {
  const router = useRouter();
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [scores, setScores] = useState<EvaluationScores>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState(1);
  const categoryRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const totalAnswered = Object.keys(scores).length;
  const progress = (totalAnswered / 20) * 100;

  useEffect(() => {
    const stored = sessionStorage.getItem('locationInfo');
    if (!stored) {
      router.push('/');
      return;
    }
    setLocationInfo(JSON.parse(stored));
  }, [router]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const catId = Number(entry.target.getAttribute('data-category'));
            if (catId) setActiveCategory(catId);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' }
    );

    Object.values(categoryRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [locationInfo]);

  const handleSelect = (criterionId: number, score: number) => {
    setScores((prev) => ({ ...prev, [String(criterionId)]: score }));
  };

  const handleSubmit = async () => {
    if (totalAnswered < 20 || !locationInfo) return;

    setIsSubmitting(true);

    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const verdict = getVerdict(totalScore);

    const evaluationData = {
      address_street: locationInfo.addressStreet,
      address_ward: locationInfo.addressWard,
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

      const { data, error } = await supabase
        .from('evaluations')
        .insert(evaluationData)
        .select('id')
        .single();

      if (error) throw error;

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
        ...evaluationData,
        created_at: new Date().toISOString(),
      };

      const existing = JSON.parse(localStorage.getItem('evaluations') || '[]');
      existing.push(evaluation);
      localStorage.setItem('evaluations', JSON.stringify(existing));

      sessionStorage.removeItem('locationInfo');
      router.push(`/result/${fallbackId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!locationInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      {/* Progress Bar */}
      <div className="sticky top-[52px] z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Tiến trình đánh giá</span>
            <span className="text-xs font-bold text-primary">{totalAnswered}/20</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="progress-fill bg-primary h-2 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const catCriteria = getCriteriaByCategory(cat.id);
            const catAnswered = catCriteria.filter((c) => scores[String(c.id)]).length;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  categoryRefs.current[cat.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-dark'
                    : catAnswered === 5
                    ? 'bg-success/10 text-success'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {cat.icon} {cat.name.split(' & ')[0]}
                {catAnswered > 0 && (
                  <span className="ml-1 opacity-70">{catAnswered}/5</span>
                )}
              </button>
            );
          })}
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

      {/* Criteria */}
      <div className="max-w-4xl mx-auto px-4 pb-32 space-y-6">
        {CATEGORIES.map((cat) => {
          const criteria = getCriteriaByCategory(cat.id);
          return (
            <div
              key={cat.id}
              ref={(el) => { categoryRefs.current[cat.id] = el; }}
              data-category={cat.id}
            >
              <div className="flex items-center gap-2 mb-3 sticky top-[140px] z-30 bg-bg py-2">
                <span className="text-xl">{cat.icon}</span>
                <h2 className="font-bold text-dark text-base">{cat.name}</h2>
              </div>

              <div className="space-y-3">
                {criteria.map((criterion) => (
                  <CriteriaCard
                    key={criterion.id}
                    criterion={criterion}
                    selectedScore={scores[String(criterion.id)]}
                    onSelect={handleSelect}
                    index={criterion.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={totalAnswered < 20 || isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all ${
              totalAnswered >= 20
                ? 'bg-primary hover:bg-primary-dark text-dark shadow-lg hover:shadow-xl active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                Đang xử lý...
              </span>
            ) : totalAnswered >= 20 ? (
              'Xem kết quả đánh giá'
            ) : (
              `Còn ${20 - totalAnswered} tiêu chí chưa đánh giá`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
