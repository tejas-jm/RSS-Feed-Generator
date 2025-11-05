import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedisClient() {
  if (!client) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 0,
    });
  }
  return client;
}

export async function setCache(key: string, value: string, ttlSeconds = 120) {
  const redis = getRedisClient();
  await redis.set(key, value, 'EX', ttlSeconds);
}

export async function getCache(key: string) {
  const redis = getRedisClient();
  return redis.get(key);
}
