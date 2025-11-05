import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth/session';
import { runFeed } from '@/lib/scraping/run-feed';
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
  const feed = await prisma.feed.findUnique({ where: { id } });
  if (!feed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await runFeed(id);
  return NextResponse.json({ ok: true });
}
