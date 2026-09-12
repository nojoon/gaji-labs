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
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  async function signOut() {
    setMenuOpen(false);
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
    <header className="relative sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
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

      <div className="relative mx-auto flex h-14 max-w-4xl items-center justify-between px-4 md:hidden">
        <NavLink href="/" className="flex items-center gap-2 text-base font-bold text-brand">
          <img src="/gaji-labs-icon.png" alt="" width={24} height={24} className="h-6 w-6 rounded-md" />
          Gaji Labs
        </NavLink>
        <div className="flex items-center gap-2">
          <CreditBadge credits={me?.credits} compact />
          <button
            type="button"
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label="메뉴 닫기"
            className="fixed inset-0 top-14 z-30 bg-black/30 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="absolute inset-x-0 top-full z-40 border-b border-slate-200 bg-white shadow-lg md:hidden">
            <div className="mx-auto max-w-4xl px-3 py-2">
              {nav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-3 text-sm font-semibold ${
                    pathname === item.href
                      ? 'bg-brand-soft text-brand-dark'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </NavLink>
              ))}
              {email ? <p className="px-3 py-2 text-xs text-slate-400">{email}</p> : null}
              <button
                type="button"
                onClick={signOut}
                className="mt-1 w-full rounded-lg px-3 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                로그아웃
              </button>
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3.5 w-4">
      <span
        className={`absolute left-0 block h-0.5 w-4 rounded-full bg-current transition ${
          open ? 'top-1.5 rotate-45' : 'top-0'
        }`}
      />
      <span
        className={`absolute left-0 top-1.5 block h-0.5 w-4 rounded-full bg-current transition ${
          open ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <span
        className={`absolute left-0 block h-0.5 w-4 rounded-full bg-current transition ${
          open ? 'top-1.5 -rotate-45' : 'top-3'
        }`}
      />
    </span>
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
