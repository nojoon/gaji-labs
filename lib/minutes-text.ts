import { displayMinutesTitle, isCallMinutes, type DiscussionItem, type MeetingMinutesResult } from './types';

const KST_DATE_RE = /^(\d{4})년\s+(\d{1,2})월\s+(\d{1,2})일(?:\s+(\d{1,2})시)?/;

function padHour(hour?: string | number) {
  let value = String(hour ?? '00');
  if (value === '24') value = '00';
  return value.padStart(2, '0');
}

export function formatKstDateHour(input: Date) {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(input);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  const hour = padHour(parts.find((part) => part.type === 'hour')?.value);
  return `${year}년 ${Number(month)}월 ${Number(day)}일 ${hour}시`;
}

/** 회의록 일시를 "2026년 8월 22일 09시" 형태로 표시 */
export function formatMeetingDateTime(value?: string | null, fallbackIso?: string | null) {
  const trimmed = (value || '').trim();
  const matched = trimmed.match(KST_DATE_RE);
  if (matched) {
    let hour = matched[4];
    if (!hour && fallbackIso) {
      const fallback = new Date(fallbackIso);
      if (!Number.isNaN(fallback.getTime())) {
        const foundHour = new Intl.DateTimeFormat('ko-KR', {
          timeZone: 'Asia/Seoul',
          hour: '2-digit',
          hour12: false,
        }).formatToParts(fallback).find((part) => part.type === 'hour')?.value;
        if (foundHour) hour = foundHour;
      }
    }
    return `${matched[1]}년 ${Number(matched[2])}월 ${Number(matched[3])}일 ${padHour(hour)}시`;
  }

  const source = trimmed && !Number.isNaN(new Date(trimmed).getTime()) ? trimmed : fallbackIso;
  if (!source) return trimmed;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return trimmed;
  return formatKstDateHour(date);
}

export function attendeesText(result?: MeetingMinutesResult | null) {
  if (!result) return '';
  if (Array.isArray(result.attendees)) return result.attendees.join(', ');
  return result.attendees || '';
}

export type MinutesDraft = {
  title: string;
  date: string;
  location: string;
  attendees: string;
  purpose: string;
  agenda: string[];
  discussion: DiscussionItem[];
  decisions: string[];
  actionItems: { task: string; owner: string; dueDate: string }[];
};

export function toEditableDraft(result: MeetingMinutesResult): MinutesDraft {
  const discussion = discussionItems(result);
  return {
    title: displayMinutesTitle(result, ''),
    date: formatMeetingDateTime(result.date),
    location: result.location || '',
    attendees: attendeesText(result),
    purpose: result.purpose || '',
    agenda: result.agenda?.length ? [...result.agenda] : [''],
    discussion: discussion.length
      ? discussion.map((item) => {
          const details = item.details?.length
            ? [...item.details]
            : item.summary ? item.summary.split(/\n+/).map((line) => line.trim()).filter(Boolean) : [];
          return { agenda: item.agenda, summary: '', details };
        })
      : [{ agenda: '', summary: '', details: [] }],
    decisions: result.decisions?.length ? [...result.decisions] : [''],
    actionItems: result.actionItems?.length
      ? result.actionItems.map((item) => ({ ...item }))
      : [{ task: '', owner: '', dueDate: '' }],
  };
}

export function isMinutesDraftDirty(draft: MinutesDraft, result: MeetingMinutesResult) {
  return JSON.stringify(draftToResult(draft)) !== JSON.stringify(draftToResult(toEditableDraft(result)));
}

export function draftToResult(draft: MinutesDraft): MeetingMinutesResult {
  return {
    title: draft.title.trim(),
    date: draft.date.trim(),
    location: draft.location.trim(),
    attendees: draft.attendees.trim(),
    purpose: draft.purpose.trim(),
    agenda: draft.agenda.map((item) => item.trim()).filter(Boolean),
    discussion: draft.discussion
      .map((item) => ({
        agenda: item.agenda.trim(),
        summary: item.summary.trim(),
        details: (item.details || []).map((line) => line.trim()).filter(Boolean),
      }))
      .filter((item) => item.agenda || item.summary || item.details.length),
    decisions: draft.decisions.map((item) => item.trim()).filter(Boolean),
    actionItems: draft.actionItems
      .map((item) => ({
        task: item.task.trim(),
        owner: item.owner.trim(),
        dueDate: item.dueDate.trim(),
      }))
      .filter((item) => item.task || item.owner || item.dueDate),
  };
}

export function discussionItems(result: MeetingMinutesResult): DiscussionItem[] {
  if (Array.isArray(result.discussion)) {
    return result.discussion.map((item) => ({
      agenda: item.agenda || '',
      summary: item.summary || '',
      details: Array.isArray(item.details) ? item.details.map((line) => String(line).trim()).filter(Boolean) : [],
    }));
  }
  if (typeof result.discussion === 'string' && result.discussion.trim()) {
    return [{ agenda: '', summary: result.discussion.trim(), details: [] }];
  }
  return [];
}

export function meetingMinutesToPlainText(result: MeetingMinutesResult) {
  const discussion = discussionItems(result);
  const discussionLines = discussion.length
    ? discussion.flatMap((item, i) => {
        const head = item.agenda ? `${i + 1}. ${item.agenda}` : `${i + 1}.`;
        const details = item.details?.length
          ? item.details.filter(Boolean)
          : item.summary ? item.summary.split(/\n+/).map((line) => line.trim()).filter(Boolean) : [];
        return [head, ...details.map((line) => `- ${line}`), ''];
      })
    : [''];

  const lines = [
    `1. 회의명: ${result.title || ''}`,
    `2. 일시: ${formatMeetingDateTime(result.date)}`,
    `3. 장소(또는 온라인): ${result.location || ''}`,
    `4. ${isCallMinutes(result) ? '통화 상대' : '참석자'}: ${attendeesText(result)}`,
    '',
    '5. 안건 및 논의 내용',
    ...discussionLines,
    '6. 결정 사항',
    ...(result.decisions?.length ? result.decisions.map((d, i) => `${i + 1}. ${d}`) : ['']),
    '',
    '7. 액션 아이템',
  ];

  if (result.actionItems?.length) {
    result.actionItems.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.task}`);
      lines.push(`   담당자: ${item.owner || ''}`);
      lines.push(`   기한: ${item.dueDate || ''}`);
    });
  } else {
    lines.push('');
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}
