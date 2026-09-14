import { AppHeader } from '@/components/AppHeader';
import { AppDownloadCard } from '@/components/AppDownloadCard';
import { GlossaryPanel } from '@/components/GlossaryPanel';
import { PageLead, PageMain, PageTitle } from '@/components/PageMain';
import { createClient } from '@/lib/supabase/server';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <AppHeader email={user?.email} />
      <PageMain>
        <PageTitle>설정</PageTitle>        

        <h2 className="mt-8 text-base font-bold text-slate-800 md:text-lg">앱 다운로드</h2>
        <div className="mt-4">
          <AppDownloadCard />
        </div>

        <h2 className="mt-8 text-base font-bold text-slate-800 md:text-lg">키워드 용어집</h2>
        <p className="mt-1 text-sm text-slate-500">
          내부에서 쓰는 키워드를 등록하면, 회의록을 쓸 때 비슷한 표현을 이 용어로 맞춥니다.
        </p>
        <div className="mt-4">
          <GlossaryPanel />
        </div>
      </PageMain>
    </div>
  );
}
