'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Evaluation, getVerdictLabel, getVerdictColor, getFullAddress, VerdictType } from '@/types';
import { calculateCategoryScores } from '@/lib/scoring';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const ScoreRadar = dynamic(() => import('@/components/ScoreRadar'), { ssr: false });

// Format number with dots: 9000000 → 9.000.000
function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function DashboardPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | VerdictType>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (!auth) {
      router.push('/admin');
      return;
    }
    fetchEvaluations();
  }, [router]);

  async function fetchEvaluations() {
    // Try Supabase first, fallback to localStorage
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEvaluations(data || []);
        setLoading(false);
        return;
      } catch {
        // Fall through to localStorage
      }
    }

    // Fallback: localStorage
    const stored = JSON.parse(localStorage.getItem('evaluations') || '[]');
    setEvaluations(stored);
    setLoading(false);
  }

  const filteredEvals = filter === 'all'
    ? evaluations
    : evaluations.filter((e) => e.verdict === filter);

  const stats = {
    total: evaluations.length,
    feasible: evaluations.filter((e) => e.verdict === 'feasible').length,
    potential: evaluations.filter((e) => e.verdict === 'potential').length,
    risky: evaluations.filter((e) => e.verdict === 'risky').length,
    avgScore: evaluations.length > 0
      ? Math.round(evaluations.reduce((sum, e) => sum + e.total_score, 0) / evaluations.length)
      : 0,
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const compareItems = evaluations.filter((e) => selected.includes(e.id));

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('admin_login_time');
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-dark text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Phúc Tea"
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-primary">Dashboard</h1>
              <p className="text-xs text-gray-400">Quản lý khảo sát mặt bằng</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Tổng khảo sát" value={stats.total} color="#1C1C1C" />
          <StatCard label="Khả thi" value={stats.feasible} color="#22C55E" />
          <StatCard label="Tiềm năng" value={stats.potential} color="#EAB308" />
          <StatCard label="Rủi ro" value={stats.risky} color="#EF4444" />
          <StatCard label="Điểm TB" value={stats.avgScore} color="#FFC033" suffix="/100" />
        </div>

        {/* Filter & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'feasible', 'potential', 'risky'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-primary text-dark shadow-md'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-primary'
                }`}
              >
                {f === 'all' ? 'Tất cả' : getVerdictLabel(f)}
              </button>
            ))}
          </div>

          {selected.length >= 2 && (
            <button
              onClick={() => setShowCompare(true)}
              className="bg-dark text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-dark-light transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              So sánh ({selected.length})
            </button>
          )}
        </div>

        {/* Evaluation List */}
        {filteredEvals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-sm">Chưa có dữ liệu khảo sát</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvals.map((ev) => {
              const isSelected = selected.includes(ev.id);
              const isExpanded = expandedId === ev.id;
              const images = ev.images || [];
              return (
                <div
                  key={ev.id}
                  className={`bg-white rounded-xl border-2 transition-all overflow-hidden ${
                    isSelected ? 'border-primary shadow-md' : 'border-transparent shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="p-4 flex items-center gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(ev.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-gray-300 hover:border-primary'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-4 h-4 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>

                    {/* Score badge */}
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: getVerdictColor(ev.verdict) + '15' }}
                    >
                      <span className="text-lg font-black" style={{ color: getVerdictColor(ev.verdict) }}>
                        {ev.total_score}
                      </span>
                    </div>

                    {/* Info */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                    >
                      <p className="font-semibold text-dark text-sm truncate">{getFullAddress(ev)}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: getVerdictColor(ev.verdict) }}
                        >
                          {getVerdictLabel(ev.verdict)}
                        </span>
                        {ev.surveyor_name && (
                          <span className="text-[10px] text-gray-400">👤 {ev.surveyor_name}</span>
                        )}
                        {images.length > 0 && (
                          <span className="text-[10px] text-gray-400">📸 {images.length}</span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {new Date(ev.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    {/* Expand/Arrow */}
                    <svg
                      className={`w-5 h-5 text-gray-300 flex-shrink-0 cursor-pointer transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                      {/* Quick info */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {ev.surveyor_name && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <span className="text-gray-400">Người khảo sát</span>
                            <p className="font-semibold text-dark">{ev.surveyor_name}</p>
                          </div>
                        )}
                        {ev.rent_price && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <span className="text-gray-400">Giá thuê</span>
                            <p className="font-semibold text-dark">
                              {formatNumber(ev.rent_price)} VNĐ/{ev.rent_unit === 'year' ? 'năm' : 'tháng'}
                            </p>
                          </div>
                        )}
                        {ev.area_sqm && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <span className="text-gray-400">Diện tích</span>
                            <p className="font-semibold text-dark">{ev.area_sqm} m²</p>
                          </div>
                        )}
                        {ev.landlord_name && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <span className="text-gray-400">Chủ nhà</span>
                            <p className="font-semibold text-dark">{ev.landlord_name}</p>
                          </div>
                        )}
                        {ev.landlord_phone && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <span className="text-gray-400">SĐT chủ nhà</span>
                            <p className="font-semibold text-dark">{ev.landlord_phone}</p>
                          </div>
                        )}
                        {ev.survey_date && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <span className="text-gray-400">Ngày khảo sát</span>
                            <p className="font-semibold text-dark">{new Date(ev.survey_date).toLocaleDateString('vi-VN')}</p>
                          </div>
                        )}
                      </div>

                      {/* Competitor notes */}
                      {ev.competitor_notes && (
                        <div className="bg-orange-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-orange-600 mb-1">🏪 Đối thủ cạnh tranh</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{ev.competitor_notes}</p>
                        </div>
                      )}

                      {/* Images gallery */}
                      {images.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">📸 Hình ảnh ({images.length})</p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {images.map((url, i) => {
                              const isVideo = /\.(mp4|mov|avi|webm)$/i.test(url);
                              return isVideo ? (
                                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                  <video src={url} controls preload="metadata" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden bg-gray-100 block hover:opacity-90 transition">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt={`Hình ${i + 1}`} className="w-full h-full object-cover" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action: view full result */}
                      <button
                        onClick={() => router.push(`/result/${ev.id}`)}
                        className="w-full bg-primary/10 text-primary-dark font-bold text-sm py-2.5 rounded-xl hover:bg-primary/20 transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Xem chi tiết đầy đủ
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selected.length > 0 && selected.length < 2 && (
          <p className="text-center text-xs text-gray-400">Chọn thêm {2 - selected.length} mặt bằng để so sánh (tối đa 3)</p>
        )}
      </div>

      {/* Compare Modal */}
      {showCompare && compareItems.length >= 2 && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-4xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark text-white p-4 sm:rounded-t-2xl rounded-t-2xl flex items-center justify-between">
              <h2 className="font-bold text-primary">So sánh mặt bằng</h2>
              <button onClick={() => setShowCompare(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Radar comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {compareItems.map((ev) => (
                  <div key={ev.id} className="text-center">
                    <div
                      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2"
                      style={{ backgroundColor: getVerdictColor(ev.verdict) }}
                    >
                      <span className="text-white text-xl font-black">{ev.total_score}</span>
                    </div>
                    <p className="text-xs font-medium text-dark truncate px-2">{ev.address_street}</p>
                    <p className="text-[10px] text-gray-400 truncate px-2">{ev.address_district}, {ev.address_city}</p>
                    <span
                      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-white mt-1"
                      style={{ backgroundColor: getVerdictColor(ev.verdict) }}
                    >
                      {getVerdictLabel(ev.verdict)}
                    </span>
                    <div className="mt-3">
                      <ScoreRadar categoryScores={calculateCategoryScores(ev.scores)} size="sm" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs">Tiêu chí</th>
                      {compareItems.map((ev) => (
                        <th key={ev.id} className="text-center py-2 px-3 text-xs font-medium text-gray-500 min-w-[80px]">
                          {ev.address_street.substring(0, 15)}...
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((criterionId) => {
                      const criterion = require('@/lib/criteria').CRITERIA.find((c: { id: number }) => c.id === criterionId);
                      if (!criterion) return null;
                      const maxScore = Math.max(...compareItems.map((ev) => ev.scores[String(criterionId)] || 0));
                      return (
                        <tr key={criterionId} className="border-b border-gray-50">
                          <td className="py-2 px-3 text-xs text-gray-700">{criterion.name}</td>
                          {compareItems.map((ev) => {
                            const score = ev.scores[String(criterionId)] || 0;
                            const isBest = score === maxScore && maxScore > 0;
                            return (
                              <td key={ev.id} className="text-center py-2 px-3">
                                <span className={`inline-block w-7 h-7 rounded-full text-xs font-bold leading-7 ${
                                  isBest ? 'bg-success text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {score}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-gray-200 font-bold">
                      <td className="py-3 px-3 text-sm">TỔNG ĐIỂM</td>
                      {compareItems.map((ev) => (
                        <td key={ev.id} className="text-center py-3 px-3">
                          <span className="text-lg" style={{ color: getVerdictColor(ev.verdict) }}>
                            {ev.total_score}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, suffix }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-black" style={{ color }}>
        {value}<span className="text-sm font-normal text-gray-400">{suffix}</span>
      </p>
    </div>
  );
}
