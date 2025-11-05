import { NextResponse } from 'next/server';
import { fetchPage } from '@/lib/scraping/fetch';
import { z } from 'zod';

const schema = z.object({
  url: z.string().url(),
  userAgent: z.string().optional(),
});

export async function POST(request: Request) {
  const json = await request.json();
  const { url, userAgent } = schema.parse(json);
  const result = await fetchPage(url, userAgent);
  return NextResponse.json({
    html: result.html,
    finalUrl: result.finalUrl,
    status: result.status,
  });
}
