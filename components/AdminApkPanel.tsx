'use client';

import { useEffect, useRef, useState } from 'react';
import { InlineBusy, useLoading } from '@/components/LoadingProvider';
import { fetchAppRelease, formatFileSize, uploadAppRelease, type AppRelease } from '@/lib/api';
import { apkPackageError, extractApkPackageName } from '@/lib/apk-package';

export function AdminApkPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const { run } = useLoading();

  useEffect(() => {
    fetchAppRelease()
      .then(setRelease)
      .catch((err) => setError(err instanceof Error ? err.message : 'APK 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  async function acceptFile(file: File | null) {
    setError(null);
    setMessage(null);
    setSelected(null);
    if (!file) return;
    if (!/\.apk$/i.test(file.name)) {
      setError('APK 파일만 등록할 수 있습니다.');
      return;
    }
    const packageName = await run(() => extractApkPackageName(file), 'APK 확인 중...');
    const packageError = apkPackageError(packageName);
    if (packageError) {
      setError(packageError);
      return;
    }
    setSelected(file);
  }

  async function onUpload() {
    if (!selected) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const next = await run(() => uploadAppRelease(selected), 'APK 등록 중...');
      setRelease(next);
      setSelected(null);
      setMessage(release ? '기존 APK를 삭제하고 새 APK로 업데이트했습니다.' : 'APK를 등록했습니다.');
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'APK를 등록하지 못했습니다.');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <InlineBusy />;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-emerald-700">{message}</p> : null}

      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
        {release ? (
          <>
            <div className="font-semibold text-slate-800">현재 등록된 APK</div>
            <div className="mt-1 break-all text-slate-600">{release.fileName}</div>
            <div className="mt-1 text-slate-500">
              {formatFileSize(release.fileSize)}
              {release.packageName ? ` · ${release.packageName}` : ''}
              {release.createdAt
                ? ` · ${new Date(release.createdAt).toLocaleString('ko-KR')}`
                : ''}
            </div>
          </>
        ) : (
          <p className="text-slate-500">아직 등록된 APK가 없습니다.</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".apk,application/vnd.android.package-archive"
        className="hidden"
        onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          acceptFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`mt-4 w-full rounded-xl border-2 border-dashed px-4 py-8 text-sm font-semibold transition md:py-14 ${
          dragOver ? 'border-brand bg-brand-soft text-brand-dark' : 'border-slate-200 text-slate-600 hover:border-brand/60'
        }`}
      >
        <span className="block">{selected ? selected.name : 'APK 파일을 끌어다 놓거나 클릭해서 선택'}</span>
        <span className="mt-2 block text-xs font-medium text-slate-400 md:hidden">모바일에서는 탭해서 선택할 수 있습니다.</span>
      </button>

      {selected ? (
        <p className="mt-3 text-sm text-slate-500">
          {selected.name} · {formatFileSize(selected.size)}
          {release ? ' · 등록하면 기존 파일을 대체합니다' : ''}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!selected || uploading}
        onClick={onUpload}
        className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:bg-slate-300"
      >
        {uploading ? '등록 중...' : release ? 'APK 업데이트' : 'APK 등록'}
      </button>
    </div>
  );
}
