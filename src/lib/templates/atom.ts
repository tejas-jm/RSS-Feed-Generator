import type { Feed, FeedItem } from '@prisma/client';

export function renderAtom(feed: Feed, items: FeedItem[]): string {
  const esc = (value = '') =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const entries = items
    .map((item) => {
      const tags = (item.tags || [])
        .map((tag) => `<category term="${esc(tag)}" />`)
        .join('');
      const customFields = item.custom
        ? Object.entries(item.custom as Record<string, unknown>)
            .map(([key, value]) => `<${key}>${esc(String(value))}</${key}>`)
            .join('')
        : '';
      return `
      <entry>
        <id>${esc(item.guid)}</id>
        ${item.title ? `<title>${esc(item.title)}</title>` : ''}
        ${item.link ? `<link href="${esc(item.link)}" />` : ''}
        ${item.description ? `<content type="html"><![CDATA[${item.description}]]></content>` : ''}
        ${item.date ? `<updated>${new Date(item.date).toISOString()}</updated>` : ''}
        ${item.author ? `<author><name>${esc(item.author)}</name></author>` : ''}
        ${item.category ? `<category term="${esc(item.category)}" />` : ''}
        ${tags}
        ${customFields}
      </entry>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <id>${esc(feed.id)}</id>
    <title>${esc(feed.name)}</title>
    <link href="${esc(feed.baseUrl)}" />
    <updated>${new Date().toISOString()}</updated>
    ${entries}
  </feed>`;
}
