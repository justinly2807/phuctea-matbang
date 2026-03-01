'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const MIGRATION_SQL = `-- Phúc Tea Migration v2 - Chạy toàn bộ đoạn này trong SQL Editor
-- Sửa cột address_ward cho phép NULL (chính quyền 2 cấp)
ALTER TABLE evaluations ALTER COLUMN address_ward DROP NOT NULL;
ALTER TABLE evaluations ALTER COLUMN address_ward SET DEFAULT '';

-- Thêm cột lưu hình ảnh (JSONB array các URL)
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Thêm cột ghi chú đối thủ cạnh tranh
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS competitor_notes TEXT;

-- Thêm cột đơn vị giá thuê (tháng/năm)
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS rent_unit TEXT DEFAULT 'month';

-- Thêm RLS policy cho phép update (để admin có thể sửa)
DROP POLICY IF EXISTS "Allow public update" ON evaluations;
CREATE POLICY "Allow public update" ON evaluations
  FOR UPDATE USING (true) WITH CHECK (true);

-- Thêm RLS policy cho phép delete (để admin có thể xoá)
DROP POLICY IF EXISTS "Allow public delete" ON evaluations;
CREATE POLICY "Allow public delete" ON evaluations
  FOR DELETE USING (true);`;

const STORAGE_STEPS = [
  { step: 1, text: 'Vào menu Storage ở sidebar trái' },
  { step: 2, text: 'Bấm "New bucket" → Tên: survey-media' },
  { step: 3, text: 'BẬT toggle "Public bucket" → Bấm "Create bucket"' },
  { step: 4, text: 'Click vào bucket "survey-media" vừa tạo' },
  { step: 5, text: 'Vào tab "Policies" → Bấm "New policy"' },
  { step: 6, text: 'Chọn "For full customization" → Policy name: "Allow all"' },
  { step: 7, text: 'Allowed operations: chọn TẤT CẢ (SELECT, INSERT, UPDATE, DELETE)' },
  { step: 8, text: 'Target roles: chọn "anon" → Bấm "Review" → "Save policy"' },
];

type MigrationStatus = 'checking' | 'needed' | 'done' | 'error';
type StorageStatus = 'checking' | 'needed' | 'done' | 'error';

export default function MigratePage() {
  const router = useRouter();
  const [dbStatus, setDbStatus] = useState<MigrationStatus>('checking');
  const [storageStatus, setStorageStatus] = useState<StorageStatus>('checking');
  const [copied, setCopied] = useState(false);
  const [dbError, setDbError] = useState('');
  const [storageError, setStorageError] = useState('');

  const projectRef = 'obzhbrdjknrncapkbqdt';
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
  const storageUrl = `https://supabase.com/dashboard/project/${projectRef}/storage/buckets`;

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (!auth) {
      router.push('/admin');
      return;
    }
    checkStatus();
  }, [router]);

  async function checkStatus() {
    setDbStatus('checking');
    setStorageStatus('checking');
    setDbError('');
    setStorageError('');

    // Check DB columns
    try {
      if (!isSupabaseConfigured) throw new Error('Supabase not configured');

      const { error } = await supabase
        .from('evaluations')
        .select('images,competitor_notes,rent_unit')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist')) {
          setDbStatus('needed');
          setDbError(error.message);
        } else {
          setDbStatus('error');
          setDbError(error.message);
        }
      } else {
        setDbStatus('done');
      }
    } catch (err) {
      setDbStatus('error');
      setDbError(err instanceof Error ? err.message : 'Unknown error');
    }

    // Check Storage bucket
    try {
      if (!isSupabaseConfigured) throw new Error('Supabase not configured');

      // Try to list files in survey-media bucket
      const { error } = await supabase.storage
        .from('survey-media')
        .list('', { limit: 1 });

      if (error) {
        if (error.message.includes('not found') || error.message.includes('does not exist') || error.message.includes('Bucket not found')) {
          setStorageStatus('needed');
          setStorageError('Bucket "survey-media" chưa được tạo');
        } else {
          // Bucket exists but might have policy issues
          setStorageStatus('error');
          setStorageError(error.message);
        }
      } else {
        setStorageStatus('done');
      }
    } catch (err) {
      setStorageStatus('error');
      setStorageError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(MIGRATION_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = MIGRATION_SQL;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const StatusBadge = ({ status, label }: { status: string; label: string }) => {
    const colors = {
      checking: 'bg-gray-100 text-gray-500',
      needed: 'bg-red-100 text-red-600',
      done: 'bg-green-100 text-green-600',
      error: 'bg-orange-100 text-orange-600',
    };
    const icons = {
      checking: '⏳',
      needed: '❌',
      done: '✅',
      error: '⚠️',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${colors[status as keyof typeof colors] || colors.error}`}>
        {icons[status as keyof typeof icons]} {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-dark text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Phúc Tea" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-primary">Cấu hình Database</h1>
              <p className="text-xs text-gray-400">Migration & Storage Setup</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Overall Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-dark text-lg mb-3">📊 Trạng thái hệ thống</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 p-3 rounded-xl bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-medium text-dark">Database Columns</span>
              <StatusBadge
                status={dbStatus}
                label={
                  dbStatus === 'checking' ? 'Đang kiểm tra...'
                    : dbStatus === 'done' ? 'Đã cập nhật'
                    : dbStatus === 'needed' ? 'Cần migration'
                    : 'Lỗi kết nối'
                }
              />
            </div>
            <div className="flex-1 p-3 rounded-xl bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-medium text-dark">Storage Bucket</span>
              <StatusBadge
                status={storageStatus}
                label={
                  storageStatus === 'checking' ? 'Đang kiểm tra...'
                    : storageStatus === 'done' ? 'Đã cấu hình'
                    : storageStatus === 'needed' ? 'Chưa tạo'
                    : 'Lỗi'
                }
              />
            </div>
          </div>
          <button
            onClick={checkStatus}
            className="mt-3 w-full sm:w-auto px-5 py-2 bg-primary/10 text-primary-dark font-bold text-sm rounded-xl hover:bg-primary/20 transition"
          >
            🔄 Kiểm tra lại
          </button>
        </div>

        {/* Step 1: Database Migration */}
        <div className={`bg-white rounded-2xl shadow-sm border-2 p-5 ${dbStatus === 'done' ? 'border-green-200' : 'border-red-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-dark">1</span>
            <div>
              <h3 className="font-bold text-dark">Cập nhật Database (SQL Migration)</h3>
              <p className="text-xs text-gray-400">Thêm cột mới: images, competitor_notes, rent_unit</p>
            </div>
          </div>

          {dbStatus === 'done' ? (
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-green-600 font-bold text-sm">✅ Database đã được cập nhật đầy đủ!</p>
              <p className="text-xs text-green-500 mt-1">Tất cả cột mới đã tồn tại. Dữ liệu khảo sát sẽ được lưu đầy đủ.</p>
            </div>
          ) : (
            <>
              {dbError && (
                <div className="bg-red-50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-red-500 font-mono break-all">{dbError}</p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Làm theo 3 bước sau để cập nhật database:
                </p>

                {/* Step A: Copy SQL */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500">A. Copy đoạn SQL dưới đây</span>
                    <button
                      onClick={handleCopySQL}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        copied
                          ? 'bg-green-500 text-white'
                          : 'bg-primary text-dark hover:bg-primary-dark'
                      }`}
                    >
                      {copied ? '✅ Đã copy!' : '📋 Copy SQL'}
                    </button>
                  </div>
                  <pre className="bg-dark text-green-400 rounded-lg p-3 text-[11px] overflow-x-auto whitespace-pre max-h-48 overflow-y-auto font-mono">
                    {MIGRATION_SQL}
                  </pre>
                </div>

                {/* Step B: Open SQL Editor */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <span className="text-xs font-bold text-gray-500 block mb-2">B. Mở Supabase SQL Editor</span>
                  <a
                    href={sqlEditorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#3ECF8E] text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#36b87e] transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    Mở SQL Editor →
                  </a>
                  <p className="text-[11px] text-gray-400 mt-2">
                    Đăng nhập Supabase → Paste SQL → Bấm &quot;Run&quot; (hoặc Ctrl+Enter)
                  </p>
                </div>

                {/* Step C: Come back */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <span className="text-xs font-bold text-gray-500 block mb-2">C. Quay lại đây và bấm &quot;Kiểm tra lại&quot;</span>
                  <p className="text-xs text-gray-500">
                    Sau khi chạy SQL xong, bấm nút &quot;🔄 Kiểm tra lại&quot; ở trên để xác nhận.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Step 2: Storage Bucket */}
        <div className={`bg-white rounded-2xl shadow-sm border-2 p-5 ${storageStatus === 'done' ? 'border-green-200' : 'border-orange-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-dark">2</span>
            <div>
              <h3 className="font-bold text-dark">Tạo Storage Bucket cho hình ảnh/video</h3>
              <p className="text-xs text-gray-400">Lưu trữ ảnh & video khi đối tác upload</p>
            </div>
          </div>

          {storageStatus === 'done' ? (
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-green-600 font-bold text-sm">✅ Storage bucket đã sẵn sàng!</p>
              <p className="text-xs text-green-500 mt-1">Bucket &quot;survey-media&quot; đã được tạo và cấu hình.</p>
            </div>
          ) : (
            <>
              {storageError && (
                <div className="bg-orange-50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-orange-500">{storageError}</p>
                </div>
              )}

              <div className="space-y-3">
                <a
                  href={storageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#3ECF8E] text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#36b87e] transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  Mở Storage Dashboard →
                </a>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {STORAGE_STEPS.map((s) => (
                    <div key={s.step} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-dark">
                        {s.step}
                      </span>
                      <p className="text-xs text-gray-600">{s.text}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 italic">
                  Sau khi tạo bucket xong, bấm &quot;🔄 Kiểm tra lại&quot; ở trên để xác nhận.
                </p>
              </div>
            </>
          )}
        </div>

        {/* All done */}
        {dbStatus === 'done' && storageStatus === 'done' && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 text-center border border-green-200">
            <p className="text-3xl mb-2">🎉</p>
            <h3 className="font-bold text-green-700 text-lg">Cấu hình hoàn tất!</h3>
            <p className="text-sm text-green-600 mt-1 mb-4">
              Tất cả kết quả khảo sát và hình ảnh sẽ được lưu đầy đủ vào dashboard.
            </p>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="bg-primary text-dark font-bold px-6 py-3 rounded-xl hover:bg-primary-dark transition shadow-lg"
            >
              Về Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
