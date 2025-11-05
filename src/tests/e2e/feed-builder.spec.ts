import { test, expect } from '@playwright/test';
import { parseItems } from '@/lib/scraping/parse';
import { FieldsConfig } from '@/lib/scraping/types';
import { renderRSS } from '@/lib/templates/rss';
import type { Feed, FeedItem } from '@prisma/client';

const sampleHtml = `
<section class="stories">
  <article>
    <h2><a href="/story-1">Story one</a></h2>
    <p class="summary">First summary</p>
    <time datetime="2024-01-01">Jan 1, 2024</time>
  </article>
  <article>
    <h2><a href="/story-2">Story two</a></h2>
    <p class="summary">Second summary</p>
    <time datetime="2024-01-02">Jan 2, 2024</time>
  </article>
</section>
`;

test('full pipeline produces valid RSS', async () => {
  const config: FieldsConfig = {
    itemList: { selector: '.stories' },
    item: { selector: 'article' },
    title: { selector: 'h2 a', attr: 'text' },
    link: { selector: 'h2 a', attr: 'href', absoluteUrl: true },
    description: { selector: '.summary', attr: 'text' },
    date: { selector: 'time', attr: 'datetime', dateFormat: 'yyyy-MM-dd' },
  };
  const items = parseItems(sampleHtml, 'https://example.com/news', config);
  expect(items).toHaveLength(2);
  const feed: Feed = {
    id: 'feed-demo',
    name: 'Demo Feed',
    baseUrl: 'https://example.com/news',
    listSelector: null,
    fields: config as any,
    transform: null,
    schedule: '0 * * * *',
    format: 'rss',
    maxItems: 20,
    dedupKey: 'link',
    isPaused: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const feedItems: FeedItem[] = items.map((item, index) => ({
    id: `item-${index}`,
    feedId: feed.id,
    guid: item.guid,
    title: item.title,
    link: item.link,
    description: item.description,
    date: item.date ? new Date(item.date) : null,
    image: item.image,
    author: item.author,
    category: item.category,
    tags: item.tags ?? [],
    custom: item.custom ?? null,
    createdAt: new Date(),
  }));
  const rss = renderRSS(feed, feedItems);
  expect(rss).toContain('<rss');
  expect(rss).toContain('<item>');
});
