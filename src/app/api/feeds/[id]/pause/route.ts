import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth/session';
import { stopFeed } from '@/jobs/scheduler';
import { ensureScheduler } from '@/jobs/init';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().cuid() });

export async function POST(_: Request, { params }: { params: { id: string } }) {
  await ensureScheduler();
  const { id } = paramsSchema.parse(params);
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const feed = await prisma.feed.update({ where: { id }, data: { isPaused: true } });
  stopFeed(feed.id);
  return NextResponse.json({ feed });
}
