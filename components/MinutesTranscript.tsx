'use client';

import { useEffect, useState } from 'react';
import { InlineBusy, NavLink } from '@/components/LoadingProvider';
import { fetchMeetingMinutes, fetchMeetingTranscript } from '@/lib/api';
import { displayMinutesTitle } from '@/lib/types';

export function MinutesTranscript({ id }: { id: string }) {
  const [title, setTitle] = useState('전문');
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [job, transcript] = await Promise.all([
          fetchMeetingMinutes(id).catch(() => null),
          fetchMeetingTranscript(id),
        ]);
        if (cancelled) return;
        if (job) setTitle(displayMinutesTitle(job, '전문'));
        setText(transcript.text);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '전문을 불러오지 못했습니다.');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function copyText() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
  }

  return (
    <div>
      <NavLink href={`/minutes/${id}`} className="mb-4 inline-block text-sm font-semibold text-brand hover:text-brand-dark">
        ← 회의록
      </NavLink>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-white px-6 py-12 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">전문을 불러오지 못했습니다</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      ) : text == null ? (
        <InlineBusy message="전문을 불러오는 중..." />
      ) : (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 md:flex-row md:items-start md:justify-between md:px-6 md:py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">전문</p>
              <h1 className="mt-1 line-clamp-2 text-xl font-bold text-slate-900 md:text-2xl">{title}</h1>
            </div>
            <button
              type="button"
              onClick={copyText}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              복사
            </button>
          </div>
          <pre className="whitespace-pre-wrap break-words px-4 py-5 text-sm leading-7 text-slate-800 md:px-6">
            {text}
          </pre>
        </article>
      )}
    </div>
  );
}
