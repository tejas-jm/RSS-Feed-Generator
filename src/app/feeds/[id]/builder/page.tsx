import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/client';
import { FeedBuilder } from '@/components/builder/feed-builder';

export default async function FeedBuilderPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/sign-in');
  }
  const feed = await prisma.feed.findUnique({ where: { id: params.id } });
  if (!feed) {
    redirect('/dashboard');
  }
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Edit feed</h1>
        <p className="text-sm text-muted-foreground">Update selectors, transforms, and scheduling options.</p>
      </div>
      <FeedBuilder
        feedId={feed.id}
        initialConfig={feed.fields as any}
        initialName={feed.name}
        initialBaseUrl={feed.baseUrl}
        initialSchedule={feed.schedule}
        initialFormat={feed.format as any}
        initialMaxItems={feed.maxItems}
        initialDedupKey={feed.dedupKey as 'link' | 'hash'}
      />
    </div>
  );
}
