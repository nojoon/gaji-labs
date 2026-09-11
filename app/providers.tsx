'use client';

import { LoadingProvider } from '@/components/LoadingProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <LoadingProvider>{children}</LoadingProvider>;
}
