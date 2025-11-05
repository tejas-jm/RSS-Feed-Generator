import Link from 'next/link';
import { prisma } from '@/lib/db/client';
import { authOptions } from '@/lib/auth/options';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Play, Pause, Settings, Plus } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/sign-in');
  }
  const feeds = await prisma.feed.findMany({
    include: {
      runs: { orderBy: { startedAt: 'desc' }, take: 1 },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Feeds</h1>
          <p className="text-sm text-muted-foreground">Manage schedules, run jobs, and monitor freshness.</p>
        </div>
        <Link
          href="/feeds/new"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> New feed
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {feeds.map((feed) => {
          const lastRun = feed.runs[0];
          return (
            <div key={feed.id} className="flex flex-col justify-between rounded-lg border bg-card p-6 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{feed.name}</h2>
                <p className="text-sm text-muted-foreground">{feed.baseUrl}</p>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Last run</dt>
                  <dd>{lastRun ? formatDistanceToNow(lastRun.startedAt, { addSuffix: true }) : 'Never'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Items</dt>
                  <dd>{feed._count.items}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Schedule</dt>
                  <dd><code>{feed.schedule}</code></dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>{feed.isPaused ? 'Paused' : 'Active'}</dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-wrap gap-2">
                <form action={`/api/feeds/${feed.id}/run`} method="post">
                  <button className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">
                    <Play className="mr-2 h-4 w-4" /> Run now
                  </button>
                </form>
                <form action={`/api/feeds/${feed.id}/pause`} method="post">
                  <button className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">
                    <Pause className="mr-2 h-4 w-4" /> Pause
                  </button>
                </form>
                <Link
                  href={`/feeds/${feed.id}/builder`}
                  className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
                >
                  <Settings className="mr-2 h-4 w-4" /> Edit
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
