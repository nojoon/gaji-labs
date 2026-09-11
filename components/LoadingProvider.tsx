'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';

type LoadingContextValue = {
  show: (message?: string) => void;
  hide: () => void;
  startNav: (message?: string) => void;
  run: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading 은 LoadingProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('처리 중...');
  const navRef = useRef(false);

  const show = useCallback((next?: string) => {
    if (next) setMessage(next);
    setCount((value) => value + 1);
  }, []);

  const hide = useCallback(() => {
    setCount((value) => Math.max(0, value - 1));
  }, []);

  const startNav = useCallback((next?: string) => {
    navRef.current = true;
    show(next || '이동 중...');
  }, [show]);

  const run = useCallback(async <T,>(fn: () => Promise<T>, next?: string) => {
    show(next);
    try {
      return await fn();
    } finally {
      hide();
    }
  }, [hide, show]);

  useEffect(() => {
    if (!navRef.current) return;
    navRef.current = false;
    setCount(0);
  }, [pathname]);

  const value = useMemo(() => ({ show, hide, startNav, run }), [hide, run, show, startNav]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {count > 0 ? <LoadingOverlay message={message} /> : null}
    </LoadingContext.Provider>
  );
}

export function LoadingOverlay({ message = '처리 중...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/35">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-lg">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <span className="text-sm font-semibold text-slate-700">{message}</span>
      </div>
    </div>
  );
}

export function InlineBusy({ message = '불러오는 중...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      <span>{message}</span>
    </div>
  );
}

export function NavLink({
  href,
  children,
  className,
  onClick,
  ...props
}: ComponentProps<typeof Link>) {
  const { startNav } = useLoading();
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        const next = typeof href === 'string' ? href : href.pathname || '';
        if (next && next !== pathname) startNav();
      }}
      {...props}
    >
      {children}
    </Link>
  );
}

export function useLoadingRouter() {
  const router = useRouter();
  const { startNav } = useLoading();
  return useMemo(() => ({
    push(href: string, message?: string) {
      startNav(message);
      router.push(href);
    },
    replace(href: string, message?: string) {
      startNav(message);
      router.replace(href);
    },
    refresh: router.refresh,
  }), [router, startNav]);
}
