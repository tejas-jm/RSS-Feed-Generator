import { describe, expect, it } from 'vitest';
import { renderRSS } from '@/lib/templates/rss';
import { renderAtom } from '@/lib/templates/atom';
import { renderJsonFeed } from '@/lib/templates/jsonfeed';
import type { Feed, FeedItem } from '@prisma/client';

const feed: Feed = {
  id: 'feed1',
  name: 'Demo',
  baseUrl: 'https://example.com',
  listSelector: null,
  fields: {} as any,
  transform: null,
  schedule: '0 * * * *',
  format: 'all',
  maxItems: 10,
  dedupKey: 'link',
  isPaused: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const items: FeedItem[] = [
  {
    id: 'item1',
    feedId: 'feed1',
    guid: 'abc',
    title: 'Hello',
    link: 'https://example.com/hello',
    description: 'World',
    date: new Date(),
    image: 'https://example.com/img.jpg',
    author: 'Reporter',
    category: 'News',
    tags: ['News'],
    custom: { extra: 'value' },
    createdAt: new Date(),
  },
];

describe('templates', () => {
  it('renders RSS XML with key fields', () => {
    const xml = renderRSS(feed, items);
    expect(xml).toContain('<rss');
    expect(xml).toContain('<title>Hello</title>');
    expect(xml).toContain('<guid isPermaLink="false">abc</guid>');
  });

  it('renders Atom feed', () => {
    const xml = renderAtom(feed, items);
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('<entry>');
  });

  it('renders JSON Feed', () => {
    const json = JSON.parse(renderJsonFeed(feed, items));
    expect(json.title).toBe('Demo');
    expect(json.items).toHaveLength(1);
  });
});
