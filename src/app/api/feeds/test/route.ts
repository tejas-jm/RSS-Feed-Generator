import { NextResponse } from 'next/server';
import { parseItems } from '@/lib/scraping/parse';
import { fieldsConfigSchema } from '@/lib/scraping/types';
import { z } from 'zod';

const schema = z.object({
  html: z.string().optional(),
  url: z.string().url(),
  fields: fieldsConfigSchema,
});

export async function POST(request: Request) {
  const json = await request.json();
  const { html, url, fields } = schema.parse(json);
  if (!html) {
    return NextResponse.json({ items: [] });
  }
  const items = parseItems(html, url, fields);
  return NextResponse.json({ items });
}
