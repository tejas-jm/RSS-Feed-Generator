import type { Feed, FeedItem } from '@prisma/client';

export function renderJsonFeed(feed: Feed, items: FeedItem[]): string {
  const origin = process.env.NEXTAUTH_URL || process.env.PUBLIC_BASE_URL || '';
  const feedUrl = origin ? `${origin.replace(/\\/$/, '')}/feeds/${feed.id}.json` : undefined;
  const document = {
    version: 'https://jsonfeed.org/version/1.1',
    title: feed.name,
    home_page_url: feed.baseUrl,
    feed_url: feedUrl,
    items: items.map((item) => ({
      id: item.guid,
      url: item.link ?? undefined,
      title: item.title ?? undefined,
      content_html: item.description ?? undefined,
      date_published: item.date ? new Date(item.date).toISOString() : undefined,
      image: item.image ?? undefined,
      authors: item.author ? [{ name: item.author }] : undefined,
      tags: item.tags && item.tags.length > 0 ? item.tags : undefined,
      _custom: item.custom ?? undefined,
    })),
  };

  return JSON.stringify(document, null, 2);
}
