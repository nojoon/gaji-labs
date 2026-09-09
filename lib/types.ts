export interface ActionItem {
  task: string;
  owner: string;
  dueDate: string;
}

export interface DiscussionItem {
  agenda: string;
  summary: string;
  details?: string[];
}

export interface MeetingMinutesResult {
  title: string;
  date: string;
  location?: string;
  attendees?: string | string[];
  purpose?: string;
  agenda: string[];
  discussion: DiscussionItem[] | string;
  decisions: string[];
  actionItems: ActionItem[];
}

export type MeetingStatus = 'processing' | 'done' | 'failed';

export interface MeetingMinutesJob {
  id: string;
  status: MeetingStatus;
  title: string | null;
  meeting_date: string | null;
  duration_seconds: number | null;
  result: MeetingMinutesResult | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export const MAX_DURATION_SECONDS = 2 * 60 * 60;
