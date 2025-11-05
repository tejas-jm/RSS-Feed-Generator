import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/utils/cache';
import { computeEtag } from '@/lib/utils/http-cache';
import { generateFeeds } from '@/lib/templates/generate';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const cacheKey = `feed:${id}:rss`;
  let payload = await getCache(cacheKey);
  let body: string | null = null;
  let updatedAt: string | null = null;
  if (payload) {
    try {
      const parsed = JSON.parse(payload) as { body: string; updated?: string };
      body = parsed.body;
      updatedAt = parsed.updated ?? null;
    } catch {
      body = payload;
    }
  }
  if (!body) {
    const result = await generateFeeds(id);
    body = result.rss;
    updatedAt = result.updated?.toISOString() ?? new Date().toISOString();
    await setCache(cacheKey, JSON.stringify({ body, updated: updatedAt }), 120);
  }
  if (!body) {
    return new NextResponse('Not found', { status: 404 });
  }
  const etag = computeEtag(body);
  const ifNoneMatch = request.headers.get('if-none-match');
  const ifModifiedSince = request.headers.get('if-modified-since');
  const lastModified = updatedAt ? new Date(updatedAt) : new Date();
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }
  if (ifModifiedSince && !Number.isNaN(Date.parse(ifModifiedSince))) {
    const since = new Date(ifModifiedSince);
    if (lastModified <= since) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag, 'Last-Modified': lastModified.toUTCString() } });
    }
  }
  const response = new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=120',
      ETag: etag,
      'Last-Modified': lastModified.toUTCString(),
    },
  });
  return response;
}
