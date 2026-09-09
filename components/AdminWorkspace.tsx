'use client';

import { useState } from 'react';
import { AdminApkPanel } from './AdminApkPanel';
import { AdminUsersPanel } from './AdminUsersPanel';

type Tab = 'users' | 'apk';

const tabs: { id: Tab; label: string; title: string; lead: string }[] = [
  {
    id: 'users',
    label: '회원 관리',
    title: '회원 관리',
    lead: '회원 목록을 보고 크레딧을 추가할 수 있습니다.',
  },
  {
    id: 'apk',
    label: '앱 APK 등록',
    title: '앱 APK 등록',
    lead: '새 APK를 올리면 기존 파일을 삭제하고 설정 페이지에서 받을 수 있게 바꿉니다.',
  },
];

export function AdminWorkspace() {
  const [tab, setTab] = useState<Tab>('users');
  const current = tabs.find((item) => item.id === tab) || tabs[0];

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg py-2 ${tab === item.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="text-base font-bold text-slate-800 md:text-lg">{current.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{current.lead}</p>
        <div className="mt-4">{tab === 'users' ? <AdminUsersPanel /> : <AdminApkPanel />}</div>
      </section>
    </div>
  );
}
