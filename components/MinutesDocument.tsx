'use client';

import { useEffect, useRef, useState } from 'react';
import { NavLink, useLoading, useLoadingRouter } from '@/components/LoadingProvider';
import { deleteMeetingMinutes, updateMeetingMinutes } from '@/lib/api';
import {
  attendeesText,
  discussionItems,
  draftToResult,
  formatMeetingDateTime,
  isMinutesDraftDirty,
  meetingMinutesToPlainText,
  toEditableDraft,
  type MinutesDraft,
} from '@/lib/minutes-text';
import { displayMinutesTitle, isCallMinutes, type MeetingMinutesJob, type MeetingMinutesResult } from '@/lib/types';
import { MinutesImages } from './MinutesImages';

export function MinutesDocument({
  id,
  result,
  onSaved,
  onEditingChange,
}: {
  id: string;
  result: MeetingMinutesResult;
  onSaved?: (job: MeetingMinutesJob) => void;
  onEditingChange?: (editing: boolean) => void;
}) {
  const router = useLoadingRouter();
  const { run } = useLoading();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MinutesDraft>(() => toEditableDraft(result));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveNext, setLeaveNext] = useState<'view' | 'list'>('view');
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(result);

  const discussion = discussionItems(current);
  const draftRef = useRef(draft);
  const currentRef = useRef(current);
  draftRef.current = draft;
  currentRef.current = current;

  async function copyText() {
    await navigator.clipboard.writeText(meetingMinutesToPlainText(current));
  }

  function downloadText() {
    const blob = new Blob([meetingMinutesToPlainText(current)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${current.title || '회의록'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    onEditingChange?.(editing);
  }, [editing, onEditingChange]);

  useEffect(() => {
    if (!editing) return;
    const onPop = () => {
      if (!isMinutesDraftDirty(draftRef.current, currentRef.current)) {
        setEditing(false);
        return;
      }
      window.history.pushState(null, '', window.location.href);
      setLeaveNext('view');
      setLeaveOpen(true);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', onPop);
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isMinutesDraftDirty(draftRef.current, currentRef.current)) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [editing, router]);

  function startEdit() {
    setDraft(toEditableDraft(current));
    setError(null);
    setEditing(true);
  }

  function requestLeave(next: 'view' | 'list') {
    if (!editing) return false;
    if (!isMinutesDraftDirty(draft, current)) {
      discard();
      if (next === 'list') router.push('/minutes', '이동 중...');
      return false;
    }
    setLeaveNext(next);
    setLeaveOpen(true);
    return true;
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const next = draftToResult(draft);
      const job = await run(() => updateMeetingMinutes(id, next), '저장 중...');
      setCurrent(job.result ?? next);
      setEditing(false);
      onSaved?.(job);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setDraft(toEditableDraft(current));
    setEditing(false);
  }

  async function confirmSaveLeave() {
    const ok = await save();
    if (!ok) return;
    setLeaveOpen(false);
    if (leaveNext === 'list') router.push('/minutes', '이동 중...');
  }

  function confirmDiscardLeave() {
    discard();
    setLeaveOpen(false);
    if (leaveNext === 'list') router.push('/minutes', '이동 중...');
  }

  async function confirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      await run(() => deleteMeetingMinutes(id), '삭제 중...');
      router.push('/minutes', '이동 중...');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 md:flex-row md:flex-wrap md:items-start md:justify-between md:px-6 md:py-5">
        <h1 className="line-clamp-2 text-xl font-bold text-slate-900 md:text-2xl">{displayMinutesTitle(current, '회의록')}</h1>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => requestLeave('view')}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:bg-slate-300"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </>
          ) : (
            <>
              <NavLink
                href={`/minutes/${id}/transcript`}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                전문 보기
              </NavLink>
              <button
                type="button"
                onClick={copyText}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                복사
              </button>
              <button
                type="button"
                onClick={downloadText}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                다운로드
              </button>
              <button
                type="button"
                onClick={startEdit}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
              >
                편집
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      {leaveOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900">변경된 내용이 저장되지 않았습니다.</h2>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={confirmDiscardLeave}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                그냥 나가기
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={confirmSaveLeave}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:bg-slate-300"
              >
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900">회의록을 삭제할까요?</h2>
            <p className="mt-2 text-sm text-slate-500">삭제하면 되돌릴 수 없습니다.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:bg-red-300"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p> : null}

      {editing ? (
        <Editor draft={draft} setDraft={setDraft} isCall={isCallMinutes(current)} />
      ) : (
        <Viewer result={current} discussion={discussion} />
      )}
      <MinutesImages id={id} />
    </article>
  );
}

function Viewer({
  result,
  discussion,
}: {
  result: MeetingMinutesResult;
  discussion: { agenda: string; summary: string; details?: string[] }[];
}) {
  return (
    <>
      <dl className={`grid grid-cols-1 gap-x-4 gap-y-3 border-b border-slate-100 px-4 py-4 text-sm md:px-6 md:py-5 ${
        isCallMinutes(result) ? 'md:grid-cols-[8.5rem_1fr]' : 'md:grid-cols-[7rem_1fr]'
      }`}>
        <Field label="1. 회의명" value={displayMinutesTitle(result, '')} />
        <Field label="2. 일시" value={formatMeetingDateTime(result.date)} />
        <Field label="3. 장소" value={result.location} />
        <Field label={isCallMinutes(result) ? '4. 통화 상대' : '4. 참석자'} value={attendeesText(result)} />
      </dl>

      <Section title="5. 안건 및 논의 내용">
        {discussion.length ? (
          <ol className="space-y-4">
            {discussion.map((item, i) => {
              const bullets = item.details?.length
                ? item.details
                : item.summary ? item.summary.split(/\n+/).map((line) => line.trim()).filter(Boolean) : [];
              return (
                <li key={`${item.agenda}-${i}`}>
                  {item.agenda ? <div className="font-semibold text-slate-800">{item.agenda}</div> : null}
                  {bullets.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 leading-6 text-slate-700">
                      {bullets.map((line, di) => (
                        <li key={`${line}-${di}`}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <Blank />
        )}
      </Section>

      <Section title="6. 결정 사항">
        {result.decisions?.length ? (
          <ol className="list-decimal space-y-1 pl-5">
            {result.decisions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        ) : (
          <Blank />
        )}
      </Section>

      <Section title="7. 액션 아이템">
        {result.actionItems?.length ? (
          <ul className="space-y-2">
            {result.actionItems.map((item, i) => (
              <li key={`${item.task}-${i}`} className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="font-medium">{item.task}</div>
                <div className="mt-1 grid grid-cols-2 gap-2 text-sm text-slate-500">
                  <span>담당자: {item.owner || ''}</span>
                  <span>기한: {item.dueDate || ''}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Blank />
        )}
      </Section>
    </>
  );
}

function Editor({
  draft,
  setDraft,
  isCall,
}: {
  draft: MinutesDraft;
  setDraft: (next: MinutesDraft) => void;
  isCall?: boolean;
}) {
  const patch = (partial: Partial<MinutesDraft>) => setDraft({ ...draft, ...partial });

  return (
    <>
      <div className={`grid grid-cols-1 gap-x-4 gap-y-3 border-b border-slate-100 px-4 py-4 text-sm md:px-6 md:py-5 ${
        isCall ? 'md:grid-cols-[8.5rem_1fr]' : 'md:grid-cols-[7rem_1fr]'
      }`}>
        <EditField label="1. 회의명" value={draft.title} onChange={(title) => patch({ title })} />
        <EditField label="2. 일시" value={draft.date} onChange={(date) => patch({ date })} />
        <EditField label="3. 장소" value={draft.location} onChange={(location) => patch({ location })} />
        <EditField label={isCall ? '4. 통화 상대' : '4. 참석자'} value={draft.attendees} onChange={(attendees) => patch({ attendees })} />
      </div>

      <Section title="5. 안건 및 논의 내용">
        <div className="space-y-3">
          {draft.discussion.map((item, i) => (
            <div key={i} className="rounded-xl bg-slate-50 p-3">
              <input
                value={item.agenda}
                onChange={(e) => {
                  const discussion = draft.discussion.map((row, idx) =>
                    idx === i ? { ...row, agenda: e.target.value } : row,
                  );
                  patch({ discussion });
                }}
                placeholder="안건명"
                className={inputClass + ' mb-2'}
              />
              <textarea
                value={(item.details || []).join('\n')}
                onChange={(e) => {
                  const discussion = draft.discussion.map((row, idx) =>
                    idx === i ? { ...row, details: e.target.value.split('\n'), summary: '' } : row,
                  );
                  patch({ discussion });
                }}
                rows={5}
                placeholder="논의 내용 (개조식, 한 줄에 하나씩)"
                className={inputClass}
              />
              {item.agenda.trim() || item.summary.trim() || (item.details || []).some((line) => line.trim()) ? (
                <button type="button" className={removeClass} onClick={() => {
                  const discussion = draft.discussion.filter((_, idx) => idx !== i);
                  patch({ discussion: discussion.length ? discussion : [{ agenda: '', summary: '', details: [] }] });
                }}>
                  삭제
                </button>
              ) : null}
            </div>
          ))}
          <AddButton
            onClick={() => patch({ discussion: [...draft.discussion, { agenda: '', summary: '', details: [] }] })}
          />
        </div>
      </Section>

      <Section title="6. 결정 사항">
        <ListEditor
          items={draft.decisions}
          placeholder="결정 사항"
          onChange={(decisions) => patch({ decisions })}
        />
      </Section>

      <Section title="7. 액션 아이템">
        <div className="space-y-3">
          {draft.actionItems.map((item, i) => (
            <div key={i} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-3">
              <input
                value={item.task}
                onChange={(e) => {
                  const actionItems = draft.actionItems.map((row, idx) =>
                    idx === i ? { ...row, task: e.target.value } : row,
                  );
                  patch({ actionItems });
                }}
                placeholder="할 일"
                className={`${inputClass} sm:col-span-3`}
              />
              <input
                value={item.owner}
                onChange={(e) => {
                  const actionItems = draft.actionItems.map((row, idx) =>
                    idx === i ? { ...row, owner: e.target.value } : row,
                  );
                  patch({ actionItems });
                }}
                placeholder="담당자"
                className={inputClass}
              />
              <input
                value={item.dueDate}
                onChange={(e) => {
                  const actionItems = draft.actionItems.map((row, idx) =>
                    idx === i ? { ...row, dueDate: e.target.value } : row,
                  );
                  patch({ actionItems });
                }}
                placeholder="기한"
                className={inputClass}
              />
              <button
                type="button"
                className={removeClass}
                onClick={() => {
                  const actionItems = draft.actionItems.filter((_, idx) => idx !== i);
                  patch({
                    actionItems: actionItems.length ? actionItems : [{ task: '', owner: '', dueDate: '' }],
                  });
                }}
              >
                삭제
              </button>
            </div>
          ))}
          <AddButton
            onClick={() => patch({ actionItems: [...draft.actionItems, { task: '', owner: '', dueDate: '' }] })}
          />
        </div>
      </Section>
    </>
  );
}

function ListEditor({
  items,
  placeholder,
  onChange,
}: {
  items: string[];
  placeholder: string;
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => onChange(items.map((row, idx) => (idx === i ? e.target.value : row)))}
            placeholder={placeholder}
            className={inputClass}
          />
          {item.trim() ? (
            <button
              type="button"
              className={removeClass}
              onClick={() => onChange(items.filter((_, idx) => idx !== i).length ? items.filter((_, idx) => idx !== i) : [''])}
            >
              삭제
            </button>
          ) : null}
        </div>
      ))}
      <AddButton onClick={() => onChange([...items, ''])} />
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-sm font-semibold text-brand hover:underline">
      + 항목 추가
    </button>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand';
const removeClass = 'text-xs text-slate-400 hover:text-red-500';

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <label className="pt-2 font-semibold text-slate-500">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <>
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="min-h-[1.25rem] text-slate-800">{value || ''}</dd>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 px-4 py-4 last:border-b-0 md:px-6 md:py-5">
      <h2 className="mb-3 text-sm font-bold text-brand">{title}</h2>
      <div className="text-slate-700">{children}</div>
    </section>
  );
}

function Blank() {
  return <div className="min-h-[1.5rem] rounded-lg border border-dashed border-slate-200" />;
}
