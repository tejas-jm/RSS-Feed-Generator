import { prisma } from '@/lib/db/client';
import { fetchPage } from './fetch';
import { parseItems } from './parse';
import { fieldsConfigSchema } from './types';
import { renderRSS } from '@/lib/templates/rss';
import { renderAtom } from '@/lib/templates/atom';
import { renderJsonFeed } from '@/lib/templates/jsonfeed';
import { setCache } from '@/lib/utils/cache';
import { pino } from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export async function runFeed(feedId: string) {
  const feed = await prisma.feed.findUnique({ where: { id: feedId } });
  if (!feed) throw new Error(`Feed ${feedId} not found`);

  const fields = fieldsConfigSchema.parse(feed.fields);
  const started = new Date();
  const run = await prisma.feedRun.create({
    data: { feedId, status: 'running', startedAt: started },
  });
  try {
    const { html, finalUrl } = await fetchPage(feed.baseUrl);
    const items = parseItems(html, finalUrl, fields);

    const existingItems = await prisma.feedItem.findMany({ where: { feedId } });
    const dedupByLink = feed.dedupKey === 'link';
    const seen = new Set(existingItems.map((item) => (dedupByLink ? item.link : item.guid)).filter(Boolean) as string[]);

    const nextItems = items.filter((item) => {
      const key = dedupByLink ? item.link : item.guid;
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (nextItems.length > 0) {
      await prisma.feedItem.createMany({
        data: nextItems.map((item) => ({
          feedId,
          guid: item.guid,
          title: item.title,
          link: item.link,
          description: item.description,
          date: item.date ? new Date(item.date) : undefined,
          image: item.image,
          author: item.author,
          category: item.category,
          tags: item.tags || [],
          custom: item.custom ?? undefined,
        })),
        skipDuplicates: true,
      });
    }

    const updatedItems = await prisma.feedItem.findMany({
      where: { feedId },
      orderBy: { createdAt: 'desc' },
      take: feed.maxItems,
    });

    const rss = renderRSS(feed, updatedItems);
    const atom = renderAtom(feed, updatedItems);
    const json = renderJsonFeed(feed, updatedItems);
    const updatedAt = updatedItems[0]?.createdAt?.toISOString() ?? new Date().toISOString();

    await setCache(`feed:${feed.id}:rss`, JSON.stringify({ body: rss, updated: updatedAt }), 120);
    await setCache(`feed:${feed.id}:atom`, JSON.stringify({ body: atom, updated: updatedAt }), 120);
    await setCache(`feed:${feed.id}:json`, JSON.stringify({ body: json, updated: updatedAt }), 120);

    await prisma.feedRun.update({
      where: { id: run.id },
      data: {
        status: 'success',
        finishedAt: new Date(),
        itemCount: updatedItems.length,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Feed run failed');
    await prisma.feedRun.update({
      where: { id: run.id },
      data: {
        status: 'error',
        finishedAt: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}
