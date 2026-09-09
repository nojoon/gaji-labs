import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { PageLead, PageMain, PageTitle } from '@/components/PageMain';
import { createClient } from '@/lib/supabase/server';
import { MinutesList } from '@/components/MinutesList';

export default async function MinutesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <AppHeader email={user?.email} />
      <PageMain>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <PageTitle>내 회의록</PageTitle>
            <PageLead>내가 만든 회의록만 표시됩니다.</PageLead>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-brand px-4 py-3 text-center text-sm font-bold text-white hover:bg-brand-dark md:py-2"
          >
            새로 만들기
          </Link>
        </div>
        <div className="mt-6 md:mt-8">
          <MinutesList />
        </div>
      </PageMain>
    </div>
  );
}
