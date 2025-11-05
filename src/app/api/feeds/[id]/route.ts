import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth/session';
import { fieldsConfigSchema } from '@/lib/scraping/types';
import { z } from 'zod';
import { scheduleFeed, stopFeed } from '@/jobs/scheduler';
import { ensureScheduler } from '@/jobs/init';

const paramsSchema = z.object({ id: z.string().cuid() });

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  baseUrl: z.string().url().optional(),
  listSelector: z.string().optional(),
  fields: fieldsConfigSchema.optional(),
  schedule: z.string().optional(),
  format: z.enum(['rss', 'atom', 'jsonfeed', 'all']).optional(),
  maxItems: z.number().min(1).max(200).optional(),
  dedupKey: z.enum(['link', 'hash']).optional(),
  isPaused: z.boolean().optional(),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await ensureScheduler();
  const { id } = paramsSchema.parse(params);
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const feed = await prisma.feed.findUnique({ where: { id }, include: { runs: true } });
  if (!feed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ feed });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  await ensureScheduler();
  const { id } = paramsSchema.parse(params);
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const json = await request.json();
  const data = updateSchema.parse(json);
  const feed = await prisma.feed.update({ where: { id }, data });
  if (data.schedule) {
    scheduleFeed(id, data.schedule);
  }
  if (typeof data.isPaused === 'boolean') {
    if (data.isPaused) stopFeed(id);
    else scheduleFeed(id, feed.schedule);
  }
  return NextResponse.json({ feed });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await ensureScheduler();
  const { id } = paramsSchema.parse(params);
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  stopFeed(id);
  await prisma.feed.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
