'use client';

import { useCallback, useMemo, useState } from 'react';
import { SelectorOverlay } from './selector-overlay';
import sanitizeHtml, { defaults as sanitizeDefaults } from 'sanitize-html';
import { Loader2, Save, RefreshCw } from 'lucide-react';
import { FieldsConfig, type FieldSelector } from '@/lib/scraping/types';

const defaultFields: FieldsConfig = {
  itemList: { selector: '', attr: 'text' },
  item: { selector: '', attr: 'text' },
  title: { selector: '', attr: 'text' },
  link: { selector: '', attr: 'href', absoluteUrl: true },
  description: { selector: '', attr: 'text' },
  date: { selector: '', attr: 'text', dateFormat: 'auto' },
};

type FieldKey = keyof FieldsConfig;

const fieldLabels: Record<FieldKey, string> = {
  itemList: 'List selector',
  item: 'Item selector',
  title: 'Title',
  link: 'Link',
  description: 'Description',
  date: 'Date',
  image: 'Image',
  author: 'Author',
  category: 'Category',
  tags: 'Tags',
  custom: 'Custom',
};

const attributeOptions = [
  { value: 'text', label: 'Text' },
  { value: 'href', label: 'href' },
  { value: 'src', label: 'src' },
  { value: 'title', label: 'title' },
  { value: 'datetime', label: 'datetime' },
  { value: 'content', label: 'content' },
  { value: 'html', label: 'Inner HTML' },
];


function pruneSelector(selector?: FieldSelector) {
  if (!selector) return undefined;
  const sanitized: FieldSelector = {};
  if (selector.selector && selector.selector.trim()) sanitized.selector = selector.selector.trim();
  if (selector.xpath && selector.xpath.trim()) sanitized.xpath = selector.xpath.trim();
  if (selector.attr && selector.attr.trim()) sanitized.attr = selector.attr.trim();
  if (selector.regex && selector.regex.trim()) sanitized.regex = selector.regex;
  if (selector.replace && selector.replace.length) sanitized.replace = selector.replace;
  if (selector.absoluteUrl) sanitized.absoluteUrl = selector.absoluteUrl;
  if (selector.required) sanitized.required = selector.required;
  if (selector.multiple) sanitized.multiple = selector.multiple;
  if (selector.dateFormat && selector.dateFormat.trim()) sanitized.dateFormat = selector.dateFormat.trim();
  if (!sanitized.selector && !sanitized.xpath) {
    return undefined;
  }
  return sanitized;
}

function pruneFields(config: FieldsConfig): FieldsConfig {
  const result: FieldsConfig = {};
  for (const [key, value] of Object.entries(config) as [keyof FieldsConfig, FieldSelector | Record<string, FieldSelector> | undefined][]) {
    if (!value) continue;
    if (key === 'custom') {
      const customEntries = Object.entries(value as Record<string, FieldSelector>).reduce<Record<string, FieldSelector>>((acc, [customKey, customValue]) => {
        const pruned = pruneSelector(customValue);
        if (pruned) acc[customKey] = pruned;
        return acc;
      }, {});
      if (Object.keys(customEntries).length > 0) {
        result.custom = customEntries;
      }
    } else {
      const pruned = pruneSelector(value as FieldSelector);
      if (pruned) {
        (result as any)[key] = pruned;
      }
    }
  }
  return result;
}
export function FeedBuilder({
  feedId,
  initialConfig,
  initialName = '',
  initialBaseUrl = '',
  initialSchedule = '*/15 * * * *',
  initialFormat = 'all',
  initialMaxItems = 50,
  initialDedupKey = 'link',
}: {
  feedId?: string;
  initialConfig?: FieldsConfig;
  initialName?: string;
  initialBaseUrl?: string;
  initialSchedule?: string;
  initialFormat?: 'rss' | 'atom' | 'jsonfeed' | 'all';
  initialMaxItems?: number;
  initialDedupKey?: 'link' | 'hash';
}) {
  const [name, setName] = useState(initialName);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<FieldsConfig>(initialConfig ?? defaultFields);
  const [activeField, setActiveField] = useState<FieldKey>('item');
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [format, setFormat] = useState<'rss' | 'atom' | 'jsonfeed' | 'all'>(initialFormat);
  const [maxItems, setMaxItems] = useState(initialMaxItems);
  const [dedupKey, setDedupKey] = useState<'link' | 'hash'>(initialDedupKey);
  const [message, setMessage] = useState<string | null>(null);
  const sanitizedHtml = useMemo(() =>
    sanitizeHtml(html, {
      allowedTags: sanitizeDefaults.allowedTags.concat(['img', 'section', 'article', 'header', 'footer', 'figure']),
      allowedAttributes: {
        '*': ['href', 'src', 'data-*', 'class', 'id', 'style', 'alt', 'title'],
      },
      allowedSchemes: ['http', 'https', 'data'],
    })
  , [html]);

  const updateField = useCallback(
    (key: FieldKey, updates: Record<string, any>) => {
      setFields((current) => ({
        ...current,
        [key]: {
          ...(current[key] || {}),
          ...updates,
        },
      }));
    },
    []
  );

  const fetchHtml = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/feeds/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl }),
      });
      if (!response.ok) throw new Error('Failed to fetch page');
      const data = await response.json();
      setHtml(data.html);
      if (data.finalUrl) {
        setBaseUrl(data.finalUrl);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to fetch HTML');
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const runPreview = useCallback(async () => {
    if (!html) return;
    const response = await fetch('/api/feeds/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, url: baseUrl, fields }),
    });
    if (!response.ok) {
      setMessage('Preview failed');
      return;
    }
    const data = await response.json();
    setPreviewItems(data.items);
  }, [html, baseUrl, fields]);

  const handleSave = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const cleanedFields = pruneFields(fields);
      const response = await fetch(feedId ? `/api/feeds/${feedId}` : '/api/feeds', {
        method: feedId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          baseUrl,
          fields: cleanedFields,
          schedule,
          format,
          maxItems,
          dedupKey,
        }),
      });
      if (!response.ok) throw new Error('Save failed');
      setMessage('Feed saved successfully');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }, [feedId, name, baseUrl, fields, schedule, format, maxItems, dedupKey]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-card p-6 shadow-sm">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Feed name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Tech News"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Source URL</label>
            <input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="https://example.com/articles"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchHtml}
              disabled={!baseUrl || loading}
              className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Fetch page
            </button>
            <button
              type="button"
              onClick={runPreview}
              disabled={!html}
              className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:border-primary hover:text-primary"
            >
              Preview items
            </button>
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>

        {sanitizedHtml ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Click an element to capture its selector. Active field: <span className="font-medium">{fieldLabels[activeField]}</span></p>
            <SelectorOverlay html={sanitizedHtml} onSelect={({ css }) => updateField(activeField, { selector: css })} />
          </div>
        ) : null}

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Field mapping</h2>
          <div className="mt-4 space-y-4">
            {(Object.keys(fieldLabels) as FieldKey[]).map((key) => {
              if (key === 'custom') return null;
              const config = fields[key];
              return (
                <div key={key} className="grid gap-2">
                  <label className="text-sm font-medium capitalize">{fieldLabels[key]}</label>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <div className="flex w-full items-center gap-2">
                      <input
                        value={config?.selector ?? ''}
                        onChange={(event) => updateField(key, { selector: event.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        placeholder="CSS selector"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveField(key)}
                        className={`inline-flex items-center rounded-md border px-3 py-2 text-xs font-medium transition ${activeField === key ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}
                      >
                        Pick
                      </button>
                    </div>
                    <select
                      value={config?.attr ?? 'text'}
                      onChange={(event) => updateField(key, { attr: event.target.value })}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      {attributeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={Boolean(config?.absoluteUrl)}
                        onChange={(event) => updateField(key, { absoluteUrl: event.target.checked })}
                      />
                      Absolute
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Feed settings</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="grid gap-1">
              <label>Schedule (CRON)</label>
              <input value={schedule} onChange={(event) => setSchedule(event.target.value)} className="rounded-md border border-border bg-background px-3 py-2" />
            </div>
            <div className="grid gap-1">
              <label>Max items</label>
              <input
                type="number"
                value={maxItems}
                onChange={(event) => setMaxItems(Math.max(1, Number(event.target.value) || 1))}
                className="rounded-md border border-border bg-background px-3 py-2"
              />
            </div>
            <div className="grid gap-1">
              <label>Output format</label>
              <select value={format} onChange={(event) => setFormat(event.target.value as any)} className="rounded-md border border-border bg-background px-3 py-2">
                <option value="all">All formats</option>
                <option value="rss">RSS 2.0</option>
                <option value="atom">Atom 1.0</option>
                <option value="jsonfeed">JSON Feed 1.1</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label>Deduplicate by</label>
              <select value={dedupKey} onChange={(event) => setDedupKey(event.target.value as any)} className="rounded-md border border-border bg-background px-3 py-2">
                <option value="link">Link</option>
                <option value="hash">Signature hash</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save feed
          </button>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Preview</h2>
          <div className="mt-4 space-y-3 text-sm">
            {previewItems.length === 0 ? <p className="text-muted-foreground">Run a preview to see sample items.</p> : null}
            {previewItems.map((item) => (
              <div key={item.guid} className="rounded border border-border/60 bg-background p-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.link}</p>
                <p className="mt-2 text-sm text-muted-foreground overflow-hidden text-ellipsis">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
