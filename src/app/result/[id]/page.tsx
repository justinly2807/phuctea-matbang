'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Evaluation, getVerdictLabel, getVerdictColor, getVerdictDescription, getFullAddress } from '@/types';
import { CATEGORIES, getCriteriaByCategory } from '@/lib/criteria';
import { calculateCategoryScores } from '@/lib/scoring';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { analyzeEvaluation } from '@/lib/analyzer';

// Format number with dots: 9000000 → 9.000.000
function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvaluation() {
      // Try localStorage first (fallback)
      if (id.startsWith('local-')) {
        const stored = JSON.parse(localStorage.getItem('evaluations') || '[]');
        const found = stored.find((e: Evaluation) => e.id === id);
        if (found) {
          setEvaluation(found);
          setLoading(false);
          return;
        }
      }

      // Fetch from Supabase if configured
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          setEvaluation(data);
          setLoading(false);
          return;
        }
      }

      // Fallback to localStorage
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

    // Try Web Share API on mobile
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or not supported - fallback to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      // Very old browser fallback
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

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Score Hero */}
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

        {/* AI Analysis */}
        {(() => {
          const analysis = analyzeEvaluation(evaluation.scores);
          return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-dark flex items-center gap-2">
                  <span className="text-lg">📊</span> Phân tích mặt bằng
                </h3>
              </div>

              <div className="p-5 space-y-5">
                {/* Điểm mạnh */}
                {analysis.strengths.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 font-semibold text-success text-sm mb-3">
                      <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs">✅</span>
                      Điểm mạnh ({analysis.strengths.length})
                    </h4>
                    <div className="space-y-2">
                      {analysis.strengths.map((s, i) => (
                        <div key={i} className="flex gap-3 bg-green-50 rounded-xl p-3">
                          <span className="text-success text-sm mt-0.5 flex-shrink-0">●</span>
                          <div>
                            <p className="text-sm font-semibold text-dark">{s.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Điểm yếu */}
                {analysis.weaknesses.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 font-semibold text-danger text-sm mb-3">
                      <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs">⚠️</span>
                      Điểm yếu cần lưu ý ({analysis.weaknesses.length})
                    </h4>
                    <div className="space-y-2">
                      {analysis.weaknesses.map((w, i) => (
                        <div key={i} className="flex gap-3 bg-red-50 rounded-xl p-3">
                          <span className="text-danger text-sm mt-0.5 flex-shrink-0">●</span>
                          <div>
                            <p className="text-sm font-semibold text-dark">{w.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{w.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gợi ý cải thiện */}
                <div>
                  <h4 className="flex items-center gap-2 font-semibold text-primary-dark text-sm mb-3">
                    <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs">💡</span>
                    Gợi ý cải thiện
                  </h4>
                  <div className="space-y-2">
                    {analysis.suggestions.map((s, i) => (
                      <div key={i} className="flex gap-3 bg-yellow-50 rounded-xl p-3">
                        <span className="text-primary-dark font-bold text-sm mt-0.5 flex-shrink-0">{i + 1}.</span>
                        <p className="text-sm text-gray-700">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Không có điểm mạnh hay yếu rõ ràng */}
                {analysis.strengths.length === 0 && analysis.weaknesses.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Tất cả tiêu chí đều ở mức trung bình. Xem chi tiết bên dưới để đánh giá cụ thể hơn.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Category Scores */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-dark mb-4">Điểm theo nhóm tiêu chí</h3>
          <div className="space-y-3">
            {categoryScores.map((cs) => (
              <div key={cs.categoryId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {CATEGORIES.find((c) => c.id === cs.categoryId)?.icon} {cs.categoryName}
                  </span>
                  <span className="text-sm font-bold text-dark">{cs.score}/{cs.maxScore}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
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

        {/* Detail Scores */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-dark">Chi tiết từng tiêu chí</h3>
          </div>
          {CATEGORIES.map((cat) => {
            const criteria = getCriteriaByCategory(cat.id);
            return (
              <div key={cat.id}>
                <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    {cat.icon} {cat.name}
                  </span>
                </div>
                {criteria.map((c) => {
                  const score = evaluation.scores[String(c.id)] || 0;
                  const option = c.options.find((o) => o.score === score);
                  return (
                    <div key={c.id} className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-dark">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{option?.label || '-'}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div
                            key={s}
                            className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                              s <= score
                                ? s <= 2 ? 'bg-danger text-white' : s <= 3 ? 'bg-warning text-dark' : 'bg-success text-white'
                                : 'bg-gray-100 text-gray-300'
                            }`}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Media Gallery */}
        {images.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-dark flex items-center gap-2">
                <span className="text-lg">📸</span> Hình ảnh mặt bằng ({images.length})
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((url, i) => {
                  const isVideo = /\.(mp4|mov|avi|webm)$/i.test(url);
                  return isVideo ? (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <video
                        src={url}
                        controls
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    </div>
                  ) : (
                    <button
                      key={i}
                      onClick={() => setLightboxImg(url)}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Hình ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Location Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h3 className="font-bold text-dark">Thông tin mặt bằng</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <InfoRow label="Địa chỉ" value={getFullAddress(evaluation)} />
            {evaluation.landlord_name && <InfoRow label="Chủ nhà" value={evaluation.landlord_name} />}
            {evaluation.landlord_phone && <InfoRow label="SĐT chủ nhà" value={evaluation.landlord_phone} />}
            {evaluation.rent_price && (
              <InfoRow
                label="Giá thuê"
                value={`${formatNumber(evaluation.rent_price)} VNĐ/${evaluation.rent_unit === 'year' ? 'năm' : 'tháng'}`}
              />
            )}
            {evaluation.area_sqm && <InfoRow label="Diện tích" value={`${evaluation.area_sqm} m²`} />}
            {evaluation.surveyor_name && <InfoRow label="Người khảo sát" value={evaluation.surveyor_name} />}
            {evaluation.survey_date && <InfoRow label="Ngày khảo sát" value={new Date(evaluation.survey_date).toLocaleDateString('vi-VN')} />}
          </div>

          {/* Competitor Notes */}
          {evaluation.competitor_notes && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Ghi chú đối thủ cạnh tranh</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                {evaluation.competitor_notes}
              </p>
            </div>
          )}
        </div>

        {/* Phúc Tea footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-bold text-primary">Phúc Tea</span> &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 no-print">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 bg-dark text-white font-bold py-3.5 rounded-xl transition-all hover:bg-dark-light flex items-center justify-center gap-2"
          >
            {shared ? (
              <>
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Đã sao chép link!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                Chia sẻ kết quả
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

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl hover:bg-white/30 transition"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImg}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 flex-shrink-0 w-24">{label}:</span>
      <span className="font-medium text-dark">{value}</span>
    </div>
  );
}
