import cron from 'node-cron';
import { prisma } from '@/lib/db/client';
import { runFeed } from '@/lib/scraping/run-feed';
import { pino } from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const schedules = new Map<string, cron.ScheduledTask>();

export async function registerSchedules() {
  const feeds = await prisma.feed.findMany({ where: { isPaused: false } });
  for (const feed of feeds) {
    scheduleFeed(feed.id, feed.schedule);
  }
}

export function scheduleFeed(feedId: string, expression: string) {
  const existing = schedules.get(feedId);
  if (existing) existing.stop();
  const task = cron.schedule(expression, async () => {
    try {
      logger.info({ feedId }, 'Running scheduled feed');
      await runFeed(feedId);
    } catch (error) {
      logger.error({ err: error, feedId }, 'Scheduled feed failed');
    }
  });
  schedules.set(feedId, task);
  task.start();
}

export function stopFeed(feedId: string) {
  const existing = schedules.get(feedId);
  if (existing) {
    existing.stop();
    schedules.delete(feedId);
  }
}
