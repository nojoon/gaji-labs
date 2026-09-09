import { AppHeader } from '@/components/AppHeader';
import { MinutesWatcher } from '@/components/MinutesWatcher';
import { PageMain } from '@/components/PageMain';
import { createClient } from '@/lib/supabase/server';

export default async function MinutesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <AppHeader email={user?.email} />
      <PageMain>
        <MinutesWatcher id={id} />
      </PageMain>
    </div>
  );
}
