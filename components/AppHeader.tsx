'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchMe, type MeProfile } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

let cachedMe: MeProfile | null = null;

export function AppHeader({ email }: { email?: string }) {
  const pathname = usePathname();
  const router = useRouter();
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
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
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
          <Link href="/" className="text-lg font-bold text-brand">
            Gaji Labs
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-brand-soft text-brand-dark'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
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
          <Link href="/" className="text-base font-bold text-brand">
            Gaji Labs
          </Link>
          <div className="flex items-center gap-2">
            <CreditBadge credits={me?.credits} compact />
            <button
              type="button"
              aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700"
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="메뉴 닫기"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(20rem,86vw)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div>
                <div className="text-sm font-bold text-slate-900">메뉴</div>
                {email ? <div className="mt-1 break-all text-xs text-slate-400">{email}</div> : null}
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-500"
              >
                닫기
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-3 text-sm font-semibold ${
                    pathname === item.href ? 'bg-brand-soft text-brand-dark' : 'text-slate-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={signOut}
                className="w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700"
              >
                로그아웃
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-4xl" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((item) => (
            <Link
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
            </Link>
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

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="block h-4 w-4">
      <span className={`block h-0.5 w-4 bg-slate-700 ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
      <span className={`mt-1 block h-0.5 w-4 bg-slate-700 ${open ? 'opacity-0' : ''}`} />
      <span className={`mt-1 block h-0.5 w-4 bg-slate-700 ${open ? '-translate-y-1.5 -rotate-45' : ''}`} />
    </span>
  );
}
