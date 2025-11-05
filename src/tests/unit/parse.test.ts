import { describe, expect, it } from 'vitest';
import { parseItems } from '@/lib/scraping/parse';
import { FieldsConfig } from '@/lib/scraping/types';

const html = `
<ul class="posts">
  <li>
    <a href="/a">First</a>
    <p class="excerpt">Summary A</p>
    <time datetime="2024-01-01">Jan 1, 2024</time>
    <img src="/img/a.jpg" />
  </li>
  <li>
    <a href="/b">Second</a>
    <p class="excerpt">Summary B</p>
    <time datetime="2024-01-02">Jan 2, 2024</time>
    <img src="/img/b.jpg" />
  </li>
</ul>
`;

describe('parseItems', () => {
  it('extracts structured fields using CSS selectors', () => {
    const config: FieldsConfig = {
      itemList: { selector: '.posts' },
      item: { selector: 'li' },
      title: { selector: 'a', attr: 'text' },
      link: { selector: 'a', attr: 'href', absoluteUrl: true },
      description: { selector: '.excerpt', attr: 'text' },
      date: { selector: 'time', attr: 'datetime', dateFormat: 'yyyy-MM-dd' },
      image: { selector: 'img', attr: 'src', absoluteUrl: true },
    };
    const items = parseItems(html, 'https://example.com/news', config);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('First');
    expect(items[0].link).toBe('https://example.com/a');
    expect(items[0].description).toBe('Summary A');
    expect(items[0].image).toBe('https://example.com/img/a.jpg');
  });
});
