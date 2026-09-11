'use client';

import { useRef, useState } from 'react';
import { useLoading, useLoadingRouter } from '@/components/LoadingProvider';
import { creditsNeeded, getAudioDurationSeconds, uploadMeetingAudio } from '@/lib/api';
import { MAX_DURATION_SECONDS } from '@/lib/types';

export function UploadPanel() {
  const router = useLoadingRouter();
  const { run } = useLoading();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function acceptFile(next: File | null) {
    setError(null);
    setDuration(null);
    setFile(null);
    if (!next) return;

    if (!next.type.startsWith('audio/') && !/\.(m4a|mp3|wav|aac|amr|3gp|ogg|webm)$/i.test(next.name)) {
      setError('오디오 파일만 업로드할 수 있습니다.');
      return;
    }

    try {
      const seconds = await run(() => getAudioDurationSeconds(next), '파일 확인 중...');
      if (seconds > MAX_DURATION_SECONDS) {
        setError(`녹음 길이는 최대 2시간까지입니다. (현재 ${formatDuration(seconds)})`);
        return;
      }
      setFile(next);
      setDuration(seconds);
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일을 확인할 수 없습니다.');
    }
  }

  async function onSubmit() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { jobId } = await run(() => uploadMeetingAudio(file), '업로드 중...');
      router.push(`/minutes/${jobId}`, '이동 중...');
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.');
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div
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
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-4 py-10 text-center transition md:px-6 md:py-14 ${
          dragOver ? 'border-brand bg-brand-soft' : 'border-slate-200 hover:border-brand/60'
        }`}
      >
        <p className="text-base font-semibold text-slate-800 md:text-lg">
          <span className="md:hidden">탭해서 녹음 파일 선택</span>
          <span className="hidden md:inline">녹음 파일을 끌어다 놓거나 클릭해서 선택</span>
        </p>
        <p className="mt-2 text-sm text-slate-500">m4a, mp3, wav 등 · 최대 2시간 · 파일은 처리 후 삭제됩니다</p>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.m4a,.mp3,.wav,.aac,.amr,.3gp,.ogg,.webm"
          className="hidden"
          onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {file && (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div className="font-medium text-slate-800">{file.name}</div>
          <div className="mt-1 text-slate-500">
            {formatBytes(file.size)}
            {duration != null ? ` · ${formatDuration(duration)} · ${creditsNeeded(duration)} 크레딧` : ''}
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={!file || uploading}
        onClick={onSubmit}
        className="mt-5 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {uploading ? '업로드 중...' : '회의록 생성'}
      </button>
    </div>
  );
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  const parts = [];
  if (h) parts.push(`${h}시간`);
  if (m) parts.push(`${m}분`);
  if (s || parts.length === 0) parts.push(`${s}초`);
  return parts.join(' ');
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
