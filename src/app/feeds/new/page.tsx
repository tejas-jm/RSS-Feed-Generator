import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import { FeedBuilder } from '@/components/builder/feed-builder';

export default async function NewFeedPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/sign-in');
  }
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">New feed</h1>
        <p className="text-sm text-muted-foreground">Select elements from the page and map them to feed fields.</p>
      </div>
      <FeedBuilder />
    </div>
  );
}
