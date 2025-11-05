import { prisma } from '@/lib/db/client';
import { renderRSS } from './rss';
import { renderAtom } from './atom';
import { renderJsonFeed } from './jsonfeed';

export async function generateFeeds(feedId: string) {
  const feed = await prisma.feed.findUnique({ where: { id: feedId } });
  if (!feed) throw new Error('Feed not found');
  const items = await prisma.feedItem.findMany({
    where: { feedId },
    orderBy: { createdAt: 'desc' },
    take: feed.maxItems,
  });
  return {
    rss: renderRSS(feed, items),
    atom: renderAtom(feed, items),
    json: renderJsonFeed(feed, items),
    updated: items[0]?.createdAt ?? feed.updatedAt,
  };
}
