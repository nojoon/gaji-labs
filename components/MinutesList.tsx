'use client';

import { useEffect, useState } from 'react';
import { InlineBusy, NavLink } from '@/components/LoadingProvider';
import { fetchMeetingMinutesList } from '@/lib/api';
import { formatMeetingDateTime } from '@/lib/minutes-text';
import { isCallMinutes, type MeetingMinutesJob } from '@/lib/types';

const POLL_MS = 4000;

export function MinutesList() {
  const [items, setItems] = useState<MeetingMinutesJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function load(isFirst: boolean) {
      if (isFirst) setLoading(true);
      try {
        const next = await fetchMeetingMinutesList();
        if (cancelled) return;
        setItems(next);
        setError(null);
        if (next.some((item) => item.status === 'processing')) {
          timer = setTimeout(() => load(false), POLL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
        timer = setTimeout(() => load(false), 6000);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load(true);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return <InlineBusy />;
  }

  if (error && items.length === 0) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">아직 회의록이 없습니다.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <NavLink
            href={`/minutes/${item.id}`}
            className="block rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm hover:border-brand/50 md:px-5"
          >
            <div className="flex items-start justify-between gap-3 md:items-center">
              <img
                src={isCallMinutes(item) ? '/call-minutes.png' : '/meeting-minutes.png'}
                alt={isCallMinutes(item) ? '통화 회의록' : '미팅 회의록'}
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <div className="break-words font-semibold text-slate-900">{item.title || '처리 중인 회의록'}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {formatMeetingDateTime(item.result?.date, item.meeting_date) || '-'}
                </div>
              </div>
              <div className="shrink-0">
                <StatusBadge status={item.status} />
              </div>
            </div>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ status }: { status: MeetingMinutesJob['status'] }) {
  const map = {
    processing: 'bg-amber-50 text-amber-700',
    done: 'bg-emerald-50 text-emerald-700',
    failed: 'bg-red-50 text-red-700',
  };
  const label = { processing: '처리 중', done: '완료', failed: '실패' };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${map[status]}`}>{label[status]}</span>
  );
}
