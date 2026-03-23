'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Evaluation, getVerdictLabel, getVerdictColor, getFullAddress, VerdictType } from '@/types';
import { calculateCategoryScores } from '@/lib/scoring';
import { supabase, isSupabaseConfigured, TABLE_EVALUATIONS } from '@/lib/supabase';

const ScoreRadar = dynamic(() => import('@/components/ScoreRadar'), { ssr: false });

// Format number with dots: 9000000 → 9.000.000
function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Get last 6 months as { key: 'YYYY-MM', label: 'Th.MM/YYYY' }
function getLast6Months(): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `Th.${d.getMonth() + 1}/${d.getFullYear()}`;
    months.push({ key, label });
  }
  return months;
}

// Export evaluations to CSV
function exportToCSV(evaluations: Evaluation[]) {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel
  const headers = ['STT', 'Dia chi', 'Quan/Huyen', 'Tinh/TP', 'Nguoi KS', 'Ngay KS', 'Gia thue', 'Dien tich', 'Tong diem', 'Ket qua', 'Ghi chu doi thu'];

  const rows = evaluations.map((ev, i) => {
    const surveyDate = ev.survey_date
      ? new Date(ev.survey_date).toLocaleDateString('vi-VN')
      : (ev.created_at ? new Date(ev.created_at).toLocaleDateString('vi-VN') : '');
    const rentPrice = ev.rent_price ? `${formatNumber(ev.rent_price)} VND/${ev.rent_unit === 'year' ? 'nam' : 'thang'}` : '';
    const area = ev.area_sqm ? `${ev.area_sqm} m2` : '';
    const verdict = getVerdictLabel(ev.verdict);
    const competitor = (ev.competitor_notes || '').replace(/"/g, '""');
    const address = (ev.address_street || '').replace(/"/g, '""');

    return [
      i + 1,
      `"${address}"`,
      `"${ev.address_district || ''}"`,
      `"${ev.address_city || ''}"`,
      `"${ev.surveyor_name || ''}"`,
      `"${surveyDate}"`,
      `"${rentPrice}"`,
      `"${area}"`,
      ev.total_score,
      `"${verdict}"`,
      `"${competitor}"`,
    ].join(',');
  });

  const csvContent = BOM + headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `khao-sat-mat-bang_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | VerdictType>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (!auth) {
      router.push('/admin');
      return;
    }
    fetchEvaluations();
    checkMigration();
  }, [router]);

  async function checkMigration() {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase
        .from(TABLE_EVALUATIONS)
        .select('images,competitor_notes,rent_unit')
        .limit(1);
      if (error && error.message.includes('does not exist')) {
        setMigrationNeeded(true);
      }
    } catch {
      // ignore
    }
  }

  async function fetchEvaluations() {
    // Try Supabase first, fallback to localStorage
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from(TABLE_EVALUATIONS)
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

  // Filter by verdict
  const verdictFiltered = filter === 'all'
    ? evaluations
    : evaluations.filter((e) => e.verdict === filter);

  // Filter by search query (address + surveyor name)
  const filteredEvals = useMemo(() => {
    if (!searchQuery.trim()) return verdictFiltered;
    const q = searchQuery.toLowerCase().trim();
    return verdictFiltered.filter((ev) => {
      const address = `${ev.address_street || ''} ${ev.address_ward || ''} ${ev.address_district || ''} ${ev.address_city || ''}`.toLowerCase();
      const surveyor = (ev.surveyor_name || '').toLowerCase();
      return address.includes(q) || surveyor.includes(q);
    });
  }, [verdictFiltered, searchQuery]);

  const stats = {
    total: evaluations.length,
    feasible: evaluations.filter((e) => e.verdict === 'feasible').length,
    potential: evaluations.filter((e) => e.verdict === 'potential').length,
    risky: evaluations.filter((e) => e.verdict === 'risky').length,
    avgScore: evaluations.length > 0
      ? Math.round(evaluations.reduce((sum, e) => sum + e.total_score, 0) / evaluations.length)
      : 0,
  };

  // Trend: evaluations per month (last 6 months)
  const trendData = useMemo(() => {
    const months = getLast6Months();
    const counts: Record<string, number> = {};
    months.forEach((m) => { counts[m.key] = 0; });
    evaluations.forEach((ev) => {
      const d = new Date(ev.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in counts) {
        counts[key]++;
      }
    });
    return months.map((m) => ({ ...m, count: counts[m.key] }));
  }, [evaluations]);

  const maxTrendCount = Math.max(...trendData.map((d) => d.count), 1);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      return [...prev, id];
    });
  };

  const selectAll = () => {
    if (selected.length === filteredEvals.length) {
      setSelected([]);
    } else {
      setSelected(filteredEvals.map((e) => e.id));
    }
  };

  const compareItems = evaluations.filter((e) => selected.includes(e.id));

  const handleDelete = async () => {
    if (selected.length === 0) return;
    setDeleting(true);

    try {
      // Get images to delete from storage
      const toDelete = evaluations.filter((e) => selected.includes(e.id));
      const allImages = toDelete.flatMap((e) => e.images || []);

      // Delete images from Supabase Storage
      if (allImages.length > 0 && isSupabaseConfigured) {
        const filePaths = allImages
          .map((url) => {
            const match = url.match(/survey-media\/(.+)$/);
            return match ? match[1] : null;
          })
          .filter(Boolean) as string[];

        if (filePaths.length > 0) {
          await supabase.storage.from('survey-media').remove(filePaths);
        }
      }

      // Delete from Supabase database
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from(TABLE_EVALUATIONS)
          .delete()
          .in('id', selected);

        if (error) throw error;
      }

      // Also remove from localStorage if any local- IDs
      const localIds = selected.filter((id) => id.startsWith('local-'));
      if (localIds.length > 0) {
        const stored = JSON.parse(localStorage.getItem('evaluations') || '[]');
        const remaining = stored.filter((e: Evaluation) => !localIds.includes(e.id));
        localStorage.setItem('evaluations', JSON.stringify(remaining));
      }

      // Remove from survey history
      const history = JSON.parse(localStorage.getItem('survey_history') || '[]');
      const updatedHistory = history.filter((h: { id: string }) => !selected.includes(h.id));
      localStorage.setItem('survey_history', JSON.stringify(updatedHistory));

      // Refresh
      setSelected([]);
      setShowDeleteConfirm(false);
      await fetchEvaluations();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Loi khi xoa. Vui long thu lai.');
    } finally {
      setDeleting(false);
    }
  };

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
              alt="Phuc Tea"
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-primary">Dashboard</h1>
              <p className="text-xs text-gray-400">Quan ly khao sat mat bang</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">
            Dang xuat
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Migration Banner */}
        {migrationNeeded && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 border-2 border-orange-200 flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">&#9888;&#65039;</span>
            <div className="flex-1">
              <p className="font-bold text-orange-700 text-sm">Database can cap nhat</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Cac cot moi (hinh anh, ghi chu doi thu, don vi gia thue) chua duoc them vao database.
                Ket qua khao sat moi se thieu du lieu cho den khi chay migration.
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/migrate')}
              className="flex-shrink-0 bg-orange-500 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-orange-600 transition"
            >
              Cau hinh ngay &rarr;
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Tong khao sat" value={stats.total} color="#1C1C1C" />
          <StatCard label="Kha thi" value={stats.feasible} color="#22C55E" />
          <StatCard label="Tiem nang" value={stats.potential} color="#EAB308" />
          <StatCard label="Rui ro" value={stats.risky} color="#EF4444" />
          <div className="col-span-2 sm:col-span-1">
            <StatCard label="Diem TB" value={stats.avgScore} color="#FFC033" suffix="/100" />
          </div>
        </div>

        {/* Trend Chart - Last 6 Months */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-3">Khao sat theo thang (6 thang gan nhat)</p>
          <div className="flex items-end gap-2 h-32">
            {trendData.map((month) => {
              const heightPercent = maxTrendCount > 0 ? (month.count / maxTrendCount) * 100 : 0;
              return (
                <div key={month.key} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-dark">{month.count}</span>
                  <div className="w-full flex items-end" style={{ height: '80px' }}>
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${Math.max(heightPercent, 4)}%`,
                        backgroundColor: month.count > 0 ? '#FFC033' : '#E5E7EB',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{month.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tim kiem theo dia chi, quan/huyen, tinh/TP, nguoi khao sat..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'feasible', 'potential', 'risky'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setSelected([]); }}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-primary text-dark shadow-md'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-primary'
                }`}
              >
                {f === 'all' ? 'Tat ca' : getVerdictLabel(f)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Export CSV Button */}
            {filteredEvals.length > 0 && (
              <button
                onClick={() => exportToCSV(filteredEvals)}
                className="px-4 py-2 rounded-full text-xs font-medium border border-gray-200 text-gray-500 hover:border-green-500 hover:text-green-600 transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Xuat Excel
              </button>
            )}

            {filteredEvals.length > 0 && (
              <button
                onClick={selectAll}
                className="px-4 py-2 rounded-full text-xs font-medium border border-gray-200 text-gray-500 hover:border-primary hover:text-dark transition"
              >
                {selected.length === filteredEvals.length ? 'Bo chon tat ca' : 'Chon tat ca'}
              </button>
            )}

            {selected.length >= 2 && selected.length <= 3 && (
              <button
                onClick={() => setShowCompare(true)}
                className="bg-dark text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-dark-light transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                So sanh ({selected.length})
              </button>
            )}

            {selected.length >= 1 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-danger text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-red-600 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Xoa ({selected.length})
              </button>
            )}
          </div>
        </div>

        {/* Search results count */}
        {searchQuery && (
          <p className="text-xs text-gray-400">
            Tim thay <strong className="text-dark">{filteredEvals.length}</strong> ket qua cho &quot;{searchQuery}&quot;
          </p>
        )}

        {/* Evaluation List */}
        {filteredEvals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-sm">
              {searchQuery ? 'Khong tim thay ket qua phu hop' : 'Chua co du lieu khao sat'}
            </p>
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
                          <span className="text-[10px] text-gray-400">&#128100; {ev.surveyor_name}</span>
                        )}
                        {images.length > 0 && (
                          <span className="text-[10px] text-gray-400">&#128248; {images.length}</span>
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
                            <span className="text-gray-400">Nguoi khao sat</span>
                            <p className="font-semibold text-dark">{ev.surveyor_name}</p>
                          </div>
                        )}
                        {ev.rent_price && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <span className="text-gray-400">Gia thue</span>
                            <p className="font-semibold text-dark">
                              {formatNumber(ev.rent_price)} VND/{ev.rent_unit === 'year' ? 'nam' : 'thang'}
                            </p>
                          </div>
                        )}
                        {ev.area_sqm && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <span className="text-gray-400">Dien tich</span>
                            <p className="font-semibold text-dark">{ev.area_sqm} m2</p>
                          </div>
                        )}
                        {ev.landlord_name && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <span className="text-gray-400">Chu nha</span>
                            <p className="font-semibold text-dark">{ev.landlord_name}</p>
                          </div>
                        )}
                        {ev.landlord_phone && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <span className="text-gray-400">SDT chu nha</span>
                            <p className="font-semibold text-dark">{ev.landlord_phone}</p>
                          </div>
                        )}
                        {ev.survey_date && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <span className="text-gray-400">Ngay khao sat</span>
                            <p className="font-semibold text-dark">{new Date(ev.survey_date).toLocaleDateString('vi-VN')}</p>
                          </div>
                        )}
                      </div>

                      {/* Competitor notes */}
                      {ev.competitor_notes && (
                        <div className="bg-orange-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-orange-600 mb-1">&#127978; Doi thu canh tranh</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{ev.competitor_notes}</p>
                        </div>
                      )}

                      {/* Images gallery */}
                      {images.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">&#128248; Hinh anh ({images.length})</p>
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
                                  <img src={url} alt={`Hinh ${i + 1}`} className="w-full h-full object-cover" />
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
                        Xem chi tiet day du
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selected.length === 1 && (
          <p className="text-center text-xs text-gray-400">Chon them 1 mat bang de so sanh, hoac bam Xoa de xoa</p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-dark text-lg mb-2">Xac nhan xoa</h3>
            <p className="text-sm text-gray-500 mb-1">
              Ban co chac muon xoa <strong className="text-dark">{selected.length}</strong> khao sat da chon?
            </p>
            <p className="text-xs text-red-400 mb-5">Hanh dong nay khong the hoan tac. Anh dinh kem cung se bi xoa.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-bold text-sm border-2 border-gray-200 text-gray-500 hover:border-dark hover:text-dark transition"
              >
                Huy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-danger text-white hover:bg-red-600 transition flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Dang xoa...
                  </>
                ) : (
                  'Xoa ngay'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompare && compareItems.length >= 2 && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-4xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark text-white p-4 sm:rounded-t-2xl rounded-t-2xl flex items-center justify-between">
              <h2 className="font-bold text-primary">So sanh mat bang</h2>
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
                      <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs">Tieu chi</th>
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
                      <td className="py-3 px-3 text-sm">TONG DIEM</td>
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
