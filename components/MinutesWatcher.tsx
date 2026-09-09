'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchMeetingMinutes } from '@/lib/api';
import type { MeetingMinutesJob } from '@/lib/types';
import { MinutesDocument } from './MinutesDocument';

export function MinutesWatcher({ id }: { id: string }) {
  const [job, setJob] = useState<MeetingMinutesJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const next = await fetchMeetingMinutes(id);
        if (cancelled) return;
        setJob(next);
        setError(null);
        if (next.status === 'processing') {
          timer = setTimeout(poll, 4000);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '조회에 실패했습니다.');
        timer = setTimeout(poll, 6000);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  if (error && !job) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!job || job.status === 'processing') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <h1 className="mt-6 text-xl font-bold text-slate-900">회의록을 작성하고 있습니다</h1>
        <p className="mt-2 text-sm text-slate-500">
          길이에 따라 몇 분에서 수십 분이 걸릴 수 있습니다. 이 화면을 닫아도 처리는 계속됩니다.
        </p>
      </div>
    );
  }

  if (job.status === 'failed') {
    return (
      <div className="rounded-2xl border border-red-100 bg-white px-6 py-12 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">회의록 생성에 실패했습니다</h1>
        <p className="mt-2 text-sm text-red-600">{job.error_message || '알 수 없는 오류'}</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white">
          다시 업로드
        </Link>
      </div>
    );
  }

  if (!job.result) {
    return <p className="text-sm text-slate-500">결과가 없습니다.</p>;
  }

  return (
    <div>
      {editing ? null : (
        <Link href="/minutes" className="mb-4 inline-block text-sm font-semibold text-brand hover:text-brand-dark">
          ← 목록
        </Link>
      )}
      <MinutesDocument
        id={job.id}
        result={job.result}
        onSaved={(next) => setJob(next)}
        onEditingChange={setEditing}
      />
    </div>
  );
}
