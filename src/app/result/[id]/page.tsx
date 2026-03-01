'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import { Evaluation, getVerdictLabel, getVerdictColor, getVerdictDescription, getFullAddress } from '@/types';
import { CATEGORIES, CRITERIA, getCriteriaByCategory } from '@/lib/criteria';
import { calculateCategoryScores } from '@/lib/scoring';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const ScoreRadar = dynamic(() => import('@/components/ScoreRadar'), { ssr: false });

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

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

  const handleExportPDF = async () => {
    if (!resultRef.current || !evaluation) return;
    setExporting(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = -(pdfHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      const fileName = `PhucTea_KhaoSat_${evaluation.address_district}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Có lỗi khi xuất PDF. Vui lòng thử lại.');
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

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div ref={resultRef} className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-dark text-center mb-4">Biểu đồ đánh giá tổng quan</h3>
          <ScoreRadar categoryScores={categoryScores} />
        </div>

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

        {/* Location Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h3 className="font-bold text-dark">Thông tin mặt bằng</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <InfoRow label="Địa chỉ" value={getFullAddress(evaluation)} />
            {evaluation.landlord_name && <InfoRow label="Chủ nhà" value={evaluation.landlord_name} />}
            {evaluation.landlord_phone && <InfoRow label="SĐT chủ nhà" value={evaluation.landlord_phone} />}
            {evaluation.rent_price && <InfoRow label="Giá thuê" value={evaluation.rent_price} />}
            {evaluation.area_sqm && <InfoRow label="Diện tích" value={`${evaluation.area_sqm} m²`} />}
            {evaluation.surveyor_name && <InfoRow label="Người khảo sát" value={evaluation.surveyor_name} />}
            {evaluation.survey_date && <InfoRow label="Ngày khảo sát" value={new Date(evaluation.survey_date).toLocaleDateString('vi-VN')} />}
          </div>
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
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex-1 bg-dark text-white font-bold py-3.5 rounded-xl transition-all hover:bg-dark-light flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xuất...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Xuất PDF
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
