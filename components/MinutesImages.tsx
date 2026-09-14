'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useLoading } from '@/components/LoadingProvider';
import {
  MAX_MINUTES_IMAGES,
  deleteMinutesImage,
  fetchMinutesImageBlob,
  fetchMinutesImages,
  uploadMinutesImages,
  type MinutesImage,
} from '@/lib/api';

export function MinutesImages({ id }: { id: string }) {
  const { run } = useLoading();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MinutesImage[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMinutesImages(id)
      .then((next) => {
        if (!cancelled) setItems(next);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '이미지를 불러오지 못했습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    async function load() {
      const next: Record<string, string> = {};
      for (const item of items) {
        try {
          const blob = await fetchMinutesImageBlob(id, item.id);
          const url = URL.createObjectURL(blob);
          created.push(url);
          next[item.id] = url;
        } catch {
          // skip broken image
        }
      }
      if (!cancelled) setUrls(next);
    }
    if (items.length) load();
    else setUrls({});
    return () => {
      cancelled = true;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [id, items]);

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    const remain = MAX_MINUTES_IMAGES - items.length;
    if (remain <= 0) {
      setError(`이미지는 최대 ${MAX_MINUTES_IMAGES}장까지 첨부할 수 있습니다.`);
      return;
    }
    try {
      setError(null);
      const uploaded = await run(() => uploadMinutesImages(id, files.slice(0, remain)), '이미지 올리는 중...');
      setItems((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지를 올리지 못했습니다.');
    }
  }

  async function onDelete(imageId: string) {
    if (!window.confirm('이 이미지를 삭제할까요?')) return;
    try {
      await run(() => deleteMinutesImage(id, imageId), '삭제 중...');
      setItems((prev) => prev.filter((item) => item.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지를 삭제하지 못했습니다.');
    }
  }

  return (
    <section className="border-t border-slate-100 px-4 py-4 md:px-6 md:py-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-brand">첨부 이미지 {items.length}/{MAX_MINUTES_IMAGES}</h2>
        <button
          type="button"
          disabled={items.length >= MAX_MINUTES_IMAGES}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:text-slate-300"
        >
          이미지 추가
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={onPick}
        />
      </div>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      {items.length ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {items.map((item) => (
            <div key={item.id} className="relative w-40 shrink-0">
              <button type="button" className="block w-full" onClick={() => urls[item.id] && setPreview(urls[item.id])}>
                {urls[item.id] ? (
                  <img src={urls[item.id]} alt="" className="h-28 w-40 rounded-xl object-cover" />
                ) : (
                  <div className="h-28 w-40 animate-pulse rounded-xl bg-slate-100" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">첨부된 이미지가 없습니다.</p>
      )}
      {preview ? (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
        >
          <img src={preview} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
        </button>
      ) : null}
    </section>
  );
}
