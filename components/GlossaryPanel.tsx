'use client';

import { useEffect, useState } from 'react';
import {
  createGlossaryKeyword,
  deleteGlossaryKeyword,
  fetchGlossaryKeywords,
  updateGlossaryKeyword,
  type GlossaryKeyword,
} from '@/lib/api';

export function GlossaryPanel() {
  const [items, setItems] = useState<GlossaryKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTerm, setEditingTerm] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGlossaryKeywords()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : '용어집을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  async function addTerm() {
    const term = draft.trim();
    if (!term) {
      setError('키워드를 입력하세요.');
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const item = await createGlossaryKeyword(term);
      setItems((prev) => [...prev, item].sort((a, b) => a.term.localeCompare(b.term, 'ko')));
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '키워드를 추가하지 못했습니다.');
    } finally {
      setAdding(false);
    }
  }

  function startEdit(item: GlossaryKeyword) {
    setEditingId(item.id);
    setEditingTerm(item.term);
    setError(null);
  }

  async function saveEdit(id: string) {
    const term = editingTerm.trim();
    if (!term) {
      setError('키워드를 입력하세요.');
      return;
    }
    setSavingId(id);
    setError(null);
    try {
      const item = await updateGlossaryKeyword(id, term);
      setItems((prev) =>
        prev.map((row) => (row.id === id ? item : row)).sort((a, b) => a.term.localeCompare(b.term, 'ko')),
      );
      setEditingId(null);
      setEditingTerm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '키워드를 수정하지 못했습니다.');
    } finally {
      setSavingId(null);
    }
  }

  async function removeTerm(item: GlossaryKeyword) {
    if (!window.confirm(`"${item.term}" 키워드를 삭제할까요?`)) return;
    setSavingId(item.id);
    setError(null);
    try {
      await deleteGlossaryKeyword(item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
      if (editingId === item.id) {
        setEditingId(null);
        setEditingTerm('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '키워드를 삭제하지 못했습니다.');
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">불러오는 중...</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <form
        className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          addTerm();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={80}
          placeholder="추가할 키워드"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:bg-slate-300"
        >
          {adding ? '추가 중' : '추가'}
        </button>
      </form>

      {error ? <p className="border-b border-red-100 px-5 py-3 text-sm text-red-600">{error}</p> : null}

      {items.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500">등록된 키워드가 없습니다.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 border-t border-slate-100 px-5 py-3">
              {editingId === item.id ? (
                <input
                  value={editingTerm}
                  onChange={(e) => setEditingTerm(e.target.value)}
                  maxLength={80}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                />
              ) : (
                <span className="flex-1 text-sm font-medium text-slate-800">{item.term}</span>
              )}
              {editingId === item.id ? (
                <>
                  <button
                    type="button"
                    disabled={savingId === item.id}
                    onClick={() => saveEdit(item.id)}
                    className="text-sm font-semibold text-brand hover:text-brand-dark"
                  >
                    {savingId === item.id ? '저장 중' : '저장'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditingTerm('');
                    }}
                    className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="text-sm font-semibold text-slate-600 hover:text-slate-900"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    disabled={savingId === item.id}
                    onClick={() => removeTerm(item)}
                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    삭제
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
