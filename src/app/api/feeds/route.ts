import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth/session';
import { fieldsConfigSchema } from '@/lib/scraping/types';
import { z } from 'zod';
import { scheduleFeed } from '@/jobs/scheduler';
import { ensureScheduler } from '@/jobs/init';

const createSchema = z.object({
  name: z.string().min(2),
  baseUrl: z.string().url(),
  listSelector: z.string().optional(),
  fields: fieldsConfigSchema,
  schedule: z.string().min(1),
  format: z.enum(['rss', 'atom', 'jsonfeed', 'all']).default('all'),
  maxItems: z.number().min(1).max(200).default(50),
  dedupKey: z.enum(['link', 'hash']).default('link'),
});

export async function GET() {
  await ensureScheduler();
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const feeds = await prisma.feed.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ feeds });
}

export async function POST(request: Request) {
  await ensureScheduler();
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const json = await request.json();
  const body = createSchema.parse(json);
  const feed = await prisma.feed.create({
    data: {
      name: body.name,
      baseUrl: body.baseUrl,
      listSelector: body.listSelector,
      fields: body.fields,
      schedule: body.schedule,
      format: body.format,
      maxItems: body.maxItems,
      dedupKey: body.dedupKey,
    },
  });
  scheduleFeed(feed.id, body.schedule);
  return NextResponse.json({ feed });
}
