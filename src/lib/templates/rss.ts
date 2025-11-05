import type { Feed, FeedItem } from '@prisma/client';

export function renderRSS(feed: Feed, items: FeedItem[]): string {
  const esc = (value = '') =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const transform = (feed.transform as Record<string, unknown> | null) ?? null;
  const description = typeof transform?.description === 'string' ? transform.description : '';
  const channel = `
    <channel>
      <title>${esc(feed.name)}</title>
      <link>${esc(feed.baseUrl)}</link>
      ${description ? `<description>${esc(description)}</description>` : ''}
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      ${items
        .map((item) => {
          const customFields = item.custom
            ? Object.entries(item.custom as Record<string, unknown>)
                .map(([key, value]) => `<${key}>${esc(String(value))}</${key}>`)
                .join('')
            : '';
          const tags = (item.tags || [])
            .map((tag) => `<category>${esc(tag)}</category>`)
            .join('');
          return `
          <item>
            ${item.title ? `<title>${esc(item.title)}</title>` : ''}
            ${item.link ? `<link>${esc(item.link)}</link>` : ''}
            ${item.description ? `<description><![CDATA[${item.description}]]></description>` : ''}
            ${item.date ? `<pubDate>${new Date(item.date).toUTCString()}</pubDate>` : ''}
            ${item.image ? `<enclosure url="${esc(item.image)}" type="image/jpeg" />` : ''}
            ${item.author ? `<author>${esc(item.author)}</author>` : ''}
            ${item.category ? `<category>${esc(item.category)}</category>` : ''}
            ${tags}
            <guid isPermaLink="false">${esc(item.guid)}</guid>
            ${customFields}
          </item>`;
        })
        .join('')}
    </channel>
  `.trim();

  return `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    ${channel}
  </rss>`;
}
