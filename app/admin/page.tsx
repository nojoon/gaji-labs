import { AppHeader } from '@/components/AppHeader';
import { AdminWorkspace } from '@/components/AdminWorkspace';
import { PageLead, PageMain, PageTitle } from '@/components/PageMain';
import { createClient } from '@/lib/supabase/server';

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <AppHeader email={user?.email} />
      <PageMain>
        <PageTitle>관리자</PageTitle>
        <PageLead>회원 크레딧과 앱 APK를 관리합니다.</PageLead>
        <AdminWorkspace />
      </PageMain>
    </div>
  );
}
