import { chromium, Browser, BrowserContext } from 'playwright';
import { isAllowedByRobots } from './robots';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export type FetchPageResult = {
  html: string;
  finalUrl: string;
  status: number;
};

const activeContexts: BrowserContext[] = [];
let activeFetches = 0;
const waitQueue: Array<() => void> = [];
const maxConcurrency = Number(process.env.MAX_CONCURRENCY || 2);

async function acquireSlot() {
  if (activeFetches < maxConcurrency) {
    activeFetches += 1;
    return;
  }
  await new Promise<void>((resolve) => waitQueue.push(resolve));
  activeFetches += 1;
}

function releaseSlot() {
  activeFetches = Math.max(0, activeFetches - 1);
  const next = waitQueue.shift();
  if (next) next();
}


async function getBrowser(): Promise<Browser> {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
  return chromium.launch({
    headless: true,
    executablePath,
  });
}

export async function fetchPage(url: string, userAgent?: string): Promise<FetchPageResult> {
  const target = new URL(url);
  const ua = userAgent || process.env.USER_AGENT || 'RSS Feed Generator Bot/1.0';
  const allowed = await isAllowedByRobots(target, ua);
  if (!allowed) {
    throw new Error(`Fetching disallowed by robots.txt for ${target.origin}`);
  }

  await acquireSlot();
  const browser = await getBrowser();
  let context: BrowserContext | null = null;
  try {
    context = await browser.newContext({ userAgent: ua });
    activeContexts.push(context);
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(Number(process.env.REQUEST_TIMEOUT_MS || 20000));
    const response = await page.goto(target.toString(), { waitUntil: 'networkidle' });
    if (!response) {
      throw new Error('No response when navigating');
    }
    const status = response.status();
    const finalUrl = response.url();
    const html = await page.content();
    return { html, finalUrl, status };
  } catch (error) {
    logger.error({ err: error }, 'Playwright fetch failed');
    throw error;
  } finally {
    if (context) {
      const index = activeContexts.indexOf(context);
      if (index >= 0) activeContexts.splice(index, 1);
      await context.close();
    }
    await browser.close();
    releaseSlot();
  }
}

export async function shutdownFetchers() {
  await Promise.all(activeContexts.map((ctx) => ctx.close()));
}
