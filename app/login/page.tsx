'use client';

import { FormEvent, useState } from 'react';
import { useLoading, useLoadingRouter } from '@/components/LoadingProvider';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const router = useLoadingRouter();
  const { show, hide } = useLoading();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    show(mode === 'login' ? '로그인 중...' : '가입 중...');
    const supabase = createClient();

    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.replace('/', '이동 중...');
        router.refresh();
        return;
      }
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (data.session) {
        router.replace('/', '이동 중...');
        router.refresh();
        return;
      }
      setInfo('가입이 완료되었습니다. 이메일 확인이 켜져 있다면 메일의 링크를 눌러 주세요. 아니면 바로 로그인하세요.');
      setMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증에 실패했습니다.');
    } finally {
      setLoading(false);
      hide();
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-xl font-bold text-slate-900 md:text-2xl">Gaji Labs</h1>        

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-medium">
          {(['login', 'signup'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded-lg py-2 ${mode === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              {item === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">이메일</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">비밀번호</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-emerald-700">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:bg-slate-300"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
      </div>
    </main>
  );
}
