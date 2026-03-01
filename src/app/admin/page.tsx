'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simple hardcoded auth
    if (email === 'ceo@phuctea.com.vn' && password === '31032017') {
      localStorage.setItem('admin_auth', 'true');
      localStorage.setItem('admin_login_time', Date.now().toString());
      router.push('/admin/dashboard');
    } else {
      setError('Email hoặc mật khẩu không đúng');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Phúc Tea"
            className="w-20 h-20 mx-auto object-contain mb-4"
          />
          <h1 className="text-2xl font-bold text-primary">Phúc Tea</h1>
          <p className="text-gray-400 text-sm mt-1">Admin Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@phuctea.com.vn"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
              required
            />
          </div>

          {error && (
            <p className="text-danger text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-dark font-bold py-3.5 rounded-xl transition-all shadow-lg text-sm"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </main>
  );
}
