import * as cheerio from 'cheerio';
import crypto from 'node:crypto';
import { DateTime } from 'luxon';
import chrono from 'chrono-node';
import xpath from 'xpath';
import { DOMParser as XmldomParser, type Node as XmlNode } from '@xmldom/xmldom';
import { FieldsConfig, FieldSelector } from './types';

export type ParsedItem = {
  guid: string;
  title?: string;
  link?: string;
  description?: string;
  date?: string;
  image?: string;
  author?: string;
  category?: string;
  tags?: string[];
  custom?: Record<string, unknown>;
};

const DEFAULT_MAX_ITEMS = 50;

function resolveValue(baseUrl: string, value: string | undefined, selector?: FieldSelector) {
  if (!value) return undefined;
  if (selector?.absoluteUrl) {
    try {
      return new URL(value, baseUrl).toString();
    } catch (error) {
      return value;
    }
  }
  return value;
}

function applyRegex(value: string, selector?: FieldSelector) {
  if (!value) return value;
  if (selector?.regex) {
    const regex = new RegExp(selector.regex);
    const match = regex.exec(value);
    if (match && match[1]) {
      value = match[1];
    }
  }
  if (selector?.replace) {
    for (const rule of selector.replace) {
      value = value.replace(new RegExp(rule.from, 'g'), rule.to);
    }
  }
  return value.trim();
}

function extractField(
  $: cheerio.CheerioAPI,
  context: cheerio.Element,
  selector: FieldSelector | undefined,
  baseUrl: string
): string | string[] | undefined {
  if (!selector) return undefined;
  let nodes: cheerio.Cheerio<cheerio.Element>;
  if (selector.selector) {
    nodes = selector.selector === ':self' ? $(context) : $(context).find(selector.selector);
  } else if (selector.xpath) {
    const parser = new XmldomParser({ errorHandler: () => undefined });
    const doc = parser.parseFromString($.html(context));
    const selected = xpath.select(selector.xpath, doc) as XmlNode[];
    const values = selected
      .map((node) => {
        if ('textContent' in node && typeof (node as XmlNode & { textContent?: string }).textContent === 'string') {
          return (node as XmlNode & { textContent?: string }).textContent ?? '';
        }
        if ('nodeValue' in node && typeof (node as XmlNode & { nodeValue?: string }).nodeValue === 'string') {
          return (node as XmlNode & { nodeValue?: string }).nodeValue ?? '';
        }
        return '';
      })
      .filter(Boolean);
    if (selector.multiple) {
      return values.map((value) => applyRegex(resolveValue(baseUrl, value, selector) || '', selector));
    }
    const first = values[0];
    return first ? applyRegex(resolveValue(baseUrl, first, selector) ?? '', selector) : undefined;
  } else {
    nodes = $(context);
  }
  if (selector.multiple) {
    const values = nodes
      .map((_, el) => applyRegex(resolveValue(baseUrl, getAttr($, el, selector), selector) || '', selector))
      .get()
      .filter(Boolean);
    return values;
  }
  const value = resolveValue(baseUrl, getAttr($, nodes.first(), selector), selector);
  return value ? applyRegex(value, selector) : value;
}

function getAttr($: cheerio.CheerioAPI, el: cheerio.Element, selector: FieldSelector) {
  if (!el) return undefined;
  const attr = selector.attr || 'text';
  if (attr === 'text') return $(el).text();
  if (attr === 'html') return $(el).html() || undefined;
  return $(el).attr(attr) ?? undefined;
}

function normalizeDate(value: string | string[] | undefined, selector?: FieldSelector) {
  if (!value) return undefined;
  const dateValue = Array.isArray(value) ? value[0] : value;
  if (!dateValue) return undefined;
  if (selector?.dateFormat && selector.dateFormat !== 'auto') {
    const parsed = DateTime.fromFormat(dateValue, selector.dateFormat, { zone: 'utc' });
    if (parsed.isValid) return parsed.toISO();
  }
  const result = chrono.parseDate(dateValue);
  if (result) {
    return DateTime.fromJSDate(result).toUTC().toISO();
  }
  return undefined;
}

export function parseItems(html: string, baseUrl: string, config: FieldsConfig) {
  const $ = cheerio.load(html, { decodeEntities: true });
  const listRoot = config.itemList?.selector ? $(config.itemList.selector) : $('body');
  const items = config.item?.selector ? listRoot.find(config.item.selector).toArray() : listRoot.children().toArray();
  return items.slice(0, DEFAULT_MAX_ITEMS).map((element) => {
    const title = extractField($, element, config.title, baseUrl);
    const link = extractField($, element, config.link, baseUrl);
    const description = extractField($, element, config.description, baseUrl);
    const dateRaw = extractField($, element, config.date, baseUrl);
    const image = extractField($, element, config.image, baseUrl);
    const author = extractField($, element, config.author, baseUrl);
    const category = extractField($, element, config.category, baseUrl);
    const tags = extractField($, element, config.tags, baseUrl);

    const guidSeed = [title, link, dateRaw].flat().filter(Boolean).join('|') || Date.now().toString();

    const custom: Record<string, unknown> = {};
    if (config.custom) {
      for (const [key, selector] of Object.entries(config.custom)) {
        custom[key] = extractField($, element, selector, baseUrl);
      }
    }

    return {
      guid: crypto.createHash('sha1').update(guidSeed).digest('hex'),
      title: typeof title === 'string' ? title : Array.isArray(title) ? title[0] : undefined,
      link: typeof link === 'string' ? link : Array.isArray(link) ? link[0] : undefined,
      description: typeof description === 'string' ? description : Array.isArray(description) ? description[0] : undefined,
      date: normalizeDate(dateRaw, config.date),
      image: typeof image === 'string' ? image : Array.isArray(image) ? image[0] : undefined,
      author: typeof author === 'string' ? author : Array.isArray(author) ? author[0] : undefined,
      category: typeof category === 'string' ? category : Array.isArray(category) ? category[0] : undefined,
      tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
      custom,
    } as ParsedItem;
  });
}
