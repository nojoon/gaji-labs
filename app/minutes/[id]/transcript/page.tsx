import { AppHeader } from '@/components/AppHeader';
import { MinutesTranscript } from '@/components/MinutesTranscript';
import { PageMain } from '@/components/PageMain';
import { createClient } from '@/lib/supabase/server';

export default async function MinutesTranscriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <AppHeader email={user?.email} />
      <PageMain>
        <MinutesTranscript id={id} />
      </PageMain>
    </div>
  );
}
