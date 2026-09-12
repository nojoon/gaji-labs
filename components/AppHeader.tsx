'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchMe, type MeProfile } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { NavLink, useLoading, useLoadingRouter } from './LoadingProvider';

let cachedMe: MeProfile | null = null;

export function AppHeader({ email }: { email?: string }) {
  const pathname = usePathname();
  const router = useLoadingRouter();
  const { run } = useLoading();
  const [me, setMe] = useState<MeProfile | null>(cachedMe);

  useEffect(() => {
    fetchMe()
      .then((next) => {
        cachedMe = next;
        setMe(next);
      })
      .catch(() => {
        cachedMe = null;
        setMe(null);
      });
  }, [pathname]);

  async function signOut() {
    await run(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
    }, '로그아웃 중...');
    router.replace('/login', '이동 중...');
    router.refresh();
  }

  const nav = [
    { href: '/', label: '회의록 생성', short: '회의록 생성' },
    { href: '/minutes', label: '내 회의록', short: '회의록' },
    { href: '/settings', label: '설정', short: '설정' },
    ...(me?.isAdmin ? [{ href: '/admin', label: '관리자', short: '관리' }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto hidden h-16 max-w-4xl items-center justify-between px-4 md:flex">
          <NavLink href="/" className="flex items-center gap-2 text-lg font-bold text-brand">
            <img src="/gaji-labs-icon.png" alt="" width={28} height={28} className="h-7 w-7 rounded-md" />
            Gaji Labs
          </NavLink>
          <nav className="flex items-center gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-brand-soft text-brand-dark'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <CreditBadge credits={me?.credits} />
            {email && <span className="hidden text-xs text-slate-400 lg:inline">{email}</span>}
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              로그아웃
            </button>
          </div>
        </div>

        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 md:hidden">
          <NavLink href="/" className="flex items-center gap-2 text-base font-bold text-brand">
            <img src="/gaji-labs-icon.png" alt="" width={24} height={24} className="h-6 w-6 rounded-md" />
            Gaji Labs
          </NavLink>
          <div className="flex items-center gap-2">
            <CreditBadge credits={me?.credits} compact />
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-4xl" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2.5 text-[11px] font-semibold ${
                pathname === item.href ? 'text-brand-dark' : 'text-slate-400'
              }`}
            >
              <span
                className={`mb-1 h-1 w-5 rounded-full ${pathname === item.href ? 'bg-brand' : 'bg-transparent'}`}
              />
              {item.short}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}

function CreditBadge({ credits, compact = false }: { credits?: number; compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-brand-soft font-bold text-brand-dark ${
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span>크레딧</span>
      <span className="ml-1 inline-block min-w-[4.5ch] text-right tabular-nums">{credits ?? '-'}</span>
    </span>
  );
}
