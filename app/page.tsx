import { AppHeader } from '@/components/AppHeader';
import { PageLead, PageMain, PageTitle } from '@/components/PageMain';
import { UploadPanel } from '@/components/UploadPanel';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <AppHeader email={user?.email} />
      <PageMain>
        <PageTitle>회의록 생성</PageTitle>
        <PageLead>
          회의 녹음 파일을 올리면 회의록을 자동 생성합니다.
        </PageLead>
        <div className="mt-6 md:mt-8">
          <UploadPanel />
        </div>
      </PageMain>
    </div>
  );
}
