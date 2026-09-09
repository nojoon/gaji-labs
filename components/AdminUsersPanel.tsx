'use client';

import { useEffect, useState } from 'react';
import { fetchAdminUsers, fetchMe, grantAdminCredits, type AdminUser } from '@/lib/api';

const PAGE_SIZE = 10;

export function AdminUsersPanel() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => {
        if (!me.isAdmin) {
          setForbidden(true);
          setLoading(false);
          return;
        }
        return fetchAdminUsers(0, PAGE_SIZE).then((data) => {
          setItems(data.items);
          setHasMore(data.hasMore);
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    setError(null);
    try {
      const data = await fetchAdminUsers(items.length, PAGE_SIZE);
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : '더 불러오지 못했습니다.');
    } finally {
      setLoadingMore(false);
    }
  }

  async function addCredits(userId: string) {
    const amount = parseInt(amounts[userId] || '', 10);
    if (!Number.isInteger(amount) || amount <= 0) {
      setError('추가할 크레딧은 1 이상의 정수여야 합니다.');
      return;
    }
    setSavingId(userId);
    setError(null);
    try {
      const result = await grantAdminCredits(userId, amount);
      setItems((prev) =>
        prev.map((item) => (item.userId === userId ? { ...item, credits: result.credits } : item)),
      );
      setAmounts((prev) => ({ ...prev, [userId]: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '크레딧을 추가하지 못했습니다.');
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">불러오는 중...</p>;
  }

  if (forbidden) {
    return <p className="text-sm text-red-600">관리자만 접근할 수 있습니다.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {error ? <p className="border-b border-red-100 px-4 py-3 text-sm text-red-600 md:px-5">{error}</p> : null}

      <div className="divide-y divide-slate-100 md:hidden">
        {items.map((item) => (
          <div key={item.userId} className="px-4 py-4">
            <div className="break-all text-sm font-semibold text-slate-900">{item.email || item.userId}</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <span>크레딧 {item.credits}</span>
              <span>·</span>
              <span>{item.isAdmin ? '관리자' : '회원'}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={amounts[item.userId] || ''}
                onChange={(e) => setAmounts((prev) => ({ ...prev, [item.userId]: e.target.value }))}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand"
                placeholder="추가할 수량"
              />
              <button
                type="button"
                disabled={savingId === item.userId}
                onClick={() => addCredits(item.userId)}
                className="shrink-0 rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:bg-slate-300"
              >
                {savingId === item.userId ? '추가 중' : '추가'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <table className="hidden w-full text-left text-sm md:table">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-5 py-3 font-semibold">이메일</th>
            <th className="px-5 py-3 font-semibold">크레딧</th>
            <th className="px-5 py-3 font-semibold">권한</th>
            <th className="px-5 py-3 font-semibold">크레딧 추가</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.userId} className="border-t border-slate-100">
              <td className="px-5 py-3">{item.email || item.userId}</td>
              <td className="px-5 py-3 font-semibold">{item.credits}</td>
              <td className="px-5 py-3">{item.isAdmin ? '관리자' : '회원'}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={amounts[item.userId] || ''}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [item.userId]: e.target.value }))}
                    className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-brand"
                    placeholder="수량"
                  />
                  <button
                    type="button"
                    disabled={savingId === item.userId}
                    onClick={() => addCredits(item.userId)}
                    className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-dark disabled:bg-slate-300"
                  >
                    {savingId === item.userId ? '추가 중' : '추가'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-slate-500 md:px-5">회원이 없습니다.</p>
      ) : null}
      {hasMore ? (
        <div className="border-t border-slate-100 px-4 py-4 md:px-5">
          <button
            type="button"
            disabled={loadingMore}
            onClick={loadMore}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 md:w-auto"
          >
            {loadingMore ? '불러오는 중...' : '더보기'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
