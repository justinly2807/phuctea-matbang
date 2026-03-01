'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getVerdictLabel, getVerdictColor } from '@/types';

interface HistoryItem {
  id: string;
  address: string;
  totalScore: number;
  verdict: 'feasible' | 'potential' | 'risky';
  date: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('survey_history') || '[]');
    setItems(stored);
    setLoading(false);
  }, []);

  const clearHistory = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử khảo sát?')) {
      localStorage.removeItem('survey_history');
      setItems([]);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-dark">Lịch sử khảo sát</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {items.length > 0
                ? `${items.length} bài khảo sát đã thực hiện`
                : 'Chưa có khảo sát nào'}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-dark font-bold text-sm rounded-xl transition"
          >
            + Mới
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1">Chưa có khảo sát nào</p>
            <p className="text-sm text-gray-400 mb-6">Bắt đầu khảo sát mặt bằng đầu tiên của bạn</p>
            <button
              onClick={() => router.push('/')}
              className="bg-primary hover:bg-primary-dark text-dark font-bold px-6 py-3 rounded-xl transition"
            >
              Bắt đầu khảo sát
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => {
                const verdictColor = getVerdictColor(item.verdict);
                const verdictLabel = getVerdictLabel(item.verdict);
                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(`/result/${item.id}`)}
                    className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-3">
                      {/* Score circle */}
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: verdictColor }}
                      >
                        <span className="text-white text-sm font-black">{item.totalScore}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark truncate">{item.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                            style={{ backgroundColor: verdictColor }}
                          >
                            {verdictLabel}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(item.date).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <svg className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Clear history */}
            <div className="text-center mt-8">
              <button
                onClick={clearHistory}
                className="text-sm text-gray-400 hover:text-danger transition"
              >
                Xóa lịch sử
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
