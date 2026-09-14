import { createClient } from './supabase/client';
import type { MeetingMinutesJob, MeetingMinutesResult } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5004';

async function authHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('로그인이 필요합니다.');
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

async function parseError(response: Response) {
  const data = await response.json().catch(() => ({}));
  return data.message || data.error || `서버 오류: ${response.status}`;
}

export async function uploadMeetingAudio(file: File) {
  const headers = await authHeaders();
  const form = new FormData();
  form.append('audio', file);

  const response = await fetch(`${API_BASE}/api/meeting-minutes`, {
    method: 'POST',
    headers,
    body: form,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<{ jobId: string; status: string }>;
}

export async function fetchMeetingMinutes(id: string) {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/meeting-minutes/${id}`, { headers });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<MeetingMinutesJob>;
}

export async function fetchMeetingTranscript(id: string) {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/meeting-minutes/${id}/transcript`, { headers });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<{ text: string }>;
}

export async function updateMeetingMinutes(id: string, result: MeetingMinutesResult) {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/meeting-minutes/${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ result }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<MeetingMinutesJob>;
}

export async function deleteMeetingMinutes(id: string) {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/meeting-minutes/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function fetchMeetingMinutesList() {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/meeting-minutes`, { headers });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data = await response.json();
  return (data.items || []) as MeetingMinutesJob[];
}

export function creditsNeeded(durationSeconds: number) {
  const seconds = Math.max(0, Math.round(durationSeconds || 0));
  if (seconds <= 0) return 1;
  return Math.ceil(seconds / 60);
}

export interface MeProfile {
  userId: string;
  email: string | null;
  credits: number;
  isAdmin: boolean;
}

export async function fetchMe() {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/me`, { headers });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<MeProfile>;
}

export interface AdminUser {
  userId: string;
  email: string | null;
  credits: number;
  isAdmin: boolean;
  createdAt: string;
}

export async function fetchAdminUsers(offset = 0, limit = 10) {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/admin/users?offset=${offset}&limit=${limit}`, { headers });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<{
    items: AdminUser[];
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  }>;
}

export async function grantAdminCredits(userId: string, amount: number) {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/admin/users/${userId}/credits`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<{ credits: number; granted: number }>;
}

export interface GlossaryKeyword {
  id: string;
  term: string;
  created_at: string;
  updated_at: string;
}

export async function fetchGlossaryKeywords() {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/glossary`, { headers });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data = await response.json();
  return (data.items || []) as GlossaryKeyword[];
}

export async function createGlossaryKeyword(term: string) {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/glossary`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ term }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<GlossaryKeyword>;
}

export async function updateGlossaryKeyword(id: string, term: string) {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/glossary/${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ term }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<GlossaryKeyword>;
}

export async function deleteGlossaryKeyword(id: string) {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/glossary/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export interface AppRelease {
  id: string;
  fileName: string;
  fileSize: number;
  packageName: string | null;
  createdAt: string;
}

export async function fetchAppRelease() {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/app-release`, { headers });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data = await response.json();
  return (data.release || null) as AppRelease | null;
}

export async function downloadAppRelease() {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/api/app-release/download`, { headers });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const blob = await response.blob();
  return { blob, fileName: 'gaji-hub.apk' };
}

export async function uploadAppRelease(file: File) {
  const headers = await authHeaders();
  const form = new FormData();
  form.append('apk', file);
  const response = await fetch(`${API_BASE}/api/app-release`, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<AppRelease>;
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return '-';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getAudioDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      URL.revokeObjectURL(url);
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error('오디오 재생 길이를 확인할 수 없습니다.'));
        return;
      }
      resolve(duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('오디오 파일을 읽을 수 없습니다.'));
    };
    audio.src = url;
  });
}
