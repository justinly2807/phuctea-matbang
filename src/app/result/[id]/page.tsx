'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Evaluation, getVerdictLabel, getVerdictColor, getVerdictDescription, getFullAddress } from '@/types';
import { CATEGORIES } from '@/lib/criteria';
import { calculateCategoryScores } from '@/lib/scoring';
import { supabase, isSupabaseConfigured, TABLE_EVALUATIONS } from '@/lib/supabase';
import { analyzeEvaluation } from '@/lib/analyzer';
import { CRITERIA } from '@/lib/criteria';

function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getSmartSummary(categoryScores: { categoryName: string; percentage: number }[], verdict: string): string {
  const sorted = [...categoryScores].sort((a, b) => b.percentage - a.percentage);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  if (verdict === 'feasible') {
    return `Mặt bằng đạt tiêu chuẩn tốt. "${best.categoryName}" là điểm mạnh nổi bật (${best.percentage}%).${worst.percentage < 70 ? ` Lưu ý "${worst.categoryName}" chỉ đạt ${worst.percentage}%.` : ''}`;
  }
  if (verdict === 'potential') {
    return `Mặt bằng có tiềm năng với "${best.categoryName}" đạt ${best.percentage}%. Cần cải thiện "${worst.categoryName}" (${worst.percentage}%) để tối ưu hơn.`;
  }
  return `Mặt bằng có nhiều hạn chế. "${worst.categoryName}" chỉ đạt ${worst.percentage}%, cần đặc biệt lưu ý trước khi quyết định.`;
}

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchEvaluation() {
      if (id.startsWith('local-')) {
        const stored = JSON.parse(localStorage.getItem('evaluations') || '[]');
        const found = stored.find((e: Evaluation) => e.id === id);
        if (found) {
          setEvaluation(found);
          setLoading(false);
          return;
        }
      }

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from(TABLE_EVALUATIONS)
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          setEvaluation(data);
          setLoading(false);
          return;
        }
      }

      const stored = JSON.parse(localStorage.getItem('evaluations') || '[]');
      const found = stored.find((e: Evaluation) => e.id === id);
      if (found) setEvaluation(found);
      setLoading(false);
    }

    fetchEvaluation();
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = evaluation
      ? `Phúc Tea - Khảo sát ${evaluation.address_district}, ${evaluation.address_city}`
      : 'Phúc Tea - Kết quả khảo sát';
    const text = evaluation
      ? `Kết quả khảo sát mặt bằng: ${evaluation.total_score}/100 - ${getVerdictLabel(evaluation.verdict)}`
      : 'Xem kết quả khảo sát mặt bằng';

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch { /* User cancelled */ }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };

  const handleExportPDF = async () => {
    if (!contentRef.current || !evaluation) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FAFAFA',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = 297;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const address = `${evaluation.address_district}-${evaluation.address_city}`.replace(/\s+/g, '-');
      pdf.save(`PhucTea-KhaoSat-${address}-${evaluation.total_score}diem.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Không thể xuất PDF. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <p className="text-gray-500 mb-4">Không tìm thấy kết quả đánh giá</p>
          <button onClick={() => router.push('/')} className="bg-primary text-dark font-bold px-6 py-3 rounded-xl">
            Khảo sát mới
          </button>
        </div>
      </div>
    );
  }

  const categoryScores = calculateCategoryScores(evaluation.scores);
  const verdictColor = getVerdictColor(evaluation.verdict);
  const verdictLabel = getVerdictLabel(evaluation.verdict);
  const images = evaluation.images || [];
  const imageUrls = images.filter((url) => !/\.(mp4|mov|avi|webm)$/i.test(url));
  const analysis = analyzeEvaluation(evaluation.scores);

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Header />

      <div ref={contentRef} className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* 1. Score Hero */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 text-center" style={{ background: `linear-gradient(135deg, ${verdictColor}15, ${verdictColor}05)` }}>
            <div
              className="w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-4 shadow-lg"
              style={{ backgroundColor: verdictColor, boxShadow: `0 8px 30px ${verdictColor}40` }}
            >
              <span className="text-white text-4xl font-black">{evaluation.total_score}</span>
            </div>
            <div
              className="inline-block px-5 py-2 rounded-full text-white font-bold text-sm mb-2"
              style={{ backgroundColor: verdictColor }}
            >
              {verdictLabel}
            </div>
            <p className="text-gray-500 text-sm mt-2">{getVerdictDescription(evaluation.verdict)}</p>
            <p className="text-xs text-gray-400 mt-1">Tổng điểm: {evaluation.total_score}/100</p>
          </div>
        </div>

        {/* 2. Location Info (moved up for context) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h3 className="font-bold text-dark text-sm">📍 Thông tin mặt bằng</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <InfoRow label="Địa chỉ" value={getFullAddress(evaluation)} />
            {evaluation.landlord_name && <InfoRow label="Chủ nhà" value={evaluation.landlord_name} />}
            {evaluation.landlord_phone && <InfoRow label="SĐT" value={evaluation.landlord_phone} />}
            {evaluation.rent_price && (
              <InfoRow
                label="Giá thuê"
                value={`${formatNumber(evaluation.rent_price)} VNĐ/${evaluation.rent_unit === 'year' ? 'năm' : 'tháng'}`}
              />
            )}
            {evaluation.area_sqm && <InfoRow label="Diện tích" value={`${evaluation.area_sqm} m²`} />}
            {evaluation.surveyor_name && <InfoRow label="Người KS" value={evaluation.surveyor_name} />}
            {evaluation.survey_date && <InfoRow label="Ngày KS" value={new Date(evaluation.survey_date).toLocaleDateString('vi-VN')} />}
          </div>

          {evaluation.competitor_notes && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">🏪 Đối thủ cạnh tranh</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                {evaluation.competitor_notes}
              </p>
            </div>
          )}
        </div>

        {/* 3. Smart Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            💡 {getSmartSummary(categoryScores, evaluation.verdict)}
          </p>
        </div>

        {/* 4. Category Scores */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-dark mb-3 text-sm">📊 Điểm theo nhóm</h3>
          <div className="space-y-2.5">
            {categoryScores.map((cs) => (
              <div key={cs.categoryId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">
                    {CATEGORIES.find((c) => c.id === cs.categoryId)?.icon} {cs.categoryName}
                  </span>
                  <span className="text-xs font-bold text-dark">{cs.score}/{cs.maxScore}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${cs.percentage}%`,
                      backgroundColor: cs.percentage >= 80 ? '#22C55E' : cs.percentage >= 60 ? '#EAB308' : '#EF4444',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Strengths & Weaknesses */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-dark text-sm">📋 Nhận xét nhanh</h3>
          </div>
          <div className="p-4 space-y-4">
            {analysis.strengths.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-600 mb-2">✅ Điểm mạnh ({analysis.strengths.length})</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.strengths.map((s, i) => {
                    const score = evaluation.scores[String(CRITERIA.find(c => c.name === s.name)?.id)] || 0;
                    return (
                      <span key={i} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1.5 rounded-lg">
                        {s.name} <span className="text-green-500 font-bold">{score}/5</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {analysis.weaknesses.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 mb-2">⚠️ Cần lưu ý ({analysis.weaknesses.length})</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.weaknesses.map((w, i) => {
                    const score = evaluation.scores[String(CRITERIA.find(c => c.name === w.name)?.id)] || 0;
                    return (
                      <span key={i} className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-medium px-2.5 py-1.5 rounded-lg">
                        {w.name} <span className="text-red-500 font-bold">{score}/5</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {analysis.strengths.length === 0 && analysis.weaknesses.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">Tất cả tiêu chí đều ở mức trung bình (3/5).</p>
            )}

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-amber-600 mb-2">💡 Gợi ý ({analysis.suggestions.length})</p>
              <div className="space-y-1.5">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-amber-500 font-bold text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 6. Media Gallery */}
        {images.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-bold text-dark text-sm flex items-center gap-2">
                📸 Hình ảnh mặt bằng ({images.length})
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((url, i) => {
                  const isVideo = /\.(mp4|mov|avi|webm)$/i.test(url);
                  if (isVideo) {
                    return (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <video src={url} controls className="w-full h-full object-cover" preload="metadata" />
                      </div>
                    );
                  }
                  const imageIdx = imageUrls.indexOf(url);
                  return (
                    <button
                      key={i}
                      onClick={() => setLightboxIndex(imageIdx)}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Hình ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-bold text-primary">Phúc Tea</span> &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 no-print fixed-bottom-bar">
        <div className="max-w-4xl mx-auto flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 bg-dark text-white font-bold py-3.5 rounded-xl transition-all hover:bg-dark-light flex items-center justify-center gap-2"
          >
            {shared ? (
              <>
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Đã sao chép!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                Chia sẻ
              </>
            )}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="bg-white border-2 border-gray-200 text-dark font-bold py-3.5 px-4 rounded-xl transition-all hover:border-primary flex items-center justify-center gap-1.5"
          >
            {exporting ? (
              <span className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </>
            )}
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-primary hover:bg-primary-dark text-dark font-bold py-3.5 rounded-xl transition-all"
          >
            Khảo sát mới
          </button>
        </div>
      </div>

      {/* Swipe Lightbox */}
      {lightboxIndex !== null && imageUrls.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white z-10"
          >
            ✕
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/60 text-sm z-10">
            {lightboxIndex + 1} / {imageUrls.length}
          </div>

          {/* Prev */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white z-10"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next */}
          {lightboxIndex < imageUrls.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white z-10"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image with swipe */}
          <div
            className="max-w-full max-h-[85vh] px-12"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              (e.currentTarget as HTMLElement).dataset.touchStartX = String(e.touches[0].clientX);
            }}
            onTouchEnd={(e) => {
              const startX = parseFloat((e.currentTarget as HTMLElement).dataset.touchStartX || '0');
              const diff = startX - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 50) {
                if (diff > 0 && lightboxIndex < imageUrls.length - 1) {
                  setLightboxIndex(lightboxIndex + 1);
                } else if (diff < 0 && lightboxIndex > 0) {
                  setLightboxIndex(lightboxIndex - 1);
                }
              }
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrls[lightboxIndex]}
              alt={`Hình ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>

          {/* Indicator dots */}
          {imageUrls.length <= 10 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imageUrls.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`h-2 rounded-full transition-all ${
                    i === lightboxIndex ? 'bg-white w-4' : 'bg-white/40 w-2'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 flex-shrink-0 w-20 text-xs">{label}:</span>
      <span className="font-medium text-dark text-sm">{value}</span>
    </div>
  );
}
