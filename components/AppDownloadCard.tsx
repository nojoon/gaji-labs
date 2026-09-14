'use client';

import { useEffect, useState } from 'react';
import { InlineBusy, useLoading } from '@/components/LoadingProvider';
import { downloadAppRelease, fetchAppRelease, formatFileSize, type AppRelease } from '@/lib/api';

export function AppDownloadCard() {
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { run } = useLoading();

  useEffect(() => {
    fetchAppRelease()
      .then(setRelease)
      .catch((err) => setError(err instanceof Error ? err.message : '앱 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  async function onDownload() {
    setDownloading(true);
    setError(null);
    try {
      const { blob } = await run(() => downloadAppRelease(), '다운로드 중...');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gaji-hub.apk';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'APK를 다운로드하지 못했습니다.');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return <InlineBusy />;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <p className="text-sm leading-6 text-slate-500">
        안드로이드 앱만 제공합니다.
      </p>
      {release ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          {formatFileSize(release.fileSize)}
          {release.createdAt ? ` · ${new Date(release.createdAt).toLocaleString('ko-KR')}` : ''}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">아직 등록된 앱이 없습니다.</p>
      )}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        disabled={!release || downloading}
        onClick={onDownload}
        className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:bg-slate-300"
      >
        {downloading ? '다운로드 중...' : '앱 다운로드'}
      </button>
    </div>
  );
}
