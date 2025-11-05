const cache = new Map<string, { timestamp: number; allowed: boolean }>();

export async function isAllowedByRobots(url: URL, userAgent: string) {
  if (process.env.ALLOW_ROBOTS === 'false') {
    return true;
  }
  const origin = `${url.protocol}//${url.host}`;
  const cached = cache.get(origin);
  if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) {
    return cached.allowed;
  }
  try {
    const robotsUrl = new URL('/robots.txt', origin);
    const response = await fetch(robotsUrl.toString());
    if (!response.ok) {
      cache.set(origin, { timestamp: Date.now(), allowed: true });
      return true;
    }
    const text = await response.text();
    const lines = text.split(/\r?\n/);
    let applies = false;
    const disallow: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [directive, value] = trimmed.split(':', 2).map((part) => part.trim());
      if (directive.toLowerCase() === 'user-agent') {
        applies = value === '*' || value.toLowerCase() === userAgent.toLowerCase();
      } else if (applies && directive.toLowerCase() === 'disallow') {
        disallow.push(value);
      }
    }
    const path = url.pathname;
    const allowed = !disallow.some((rule) => rule && path.startsWith(rule));
    cache.set(origin, { timestamp: Date.now(), allowed });
    return allowed;
  } catch (error) {
    console.warn('robots.txt check failed', error);
    cache.set(origin, { timestamp: Date.now(), allowed: true });
    return true;
  }
}
