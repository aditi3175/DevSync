import Redis from 'ioredis';
import config from './index.js';

let redisClient = null;

/**
 * Connect to Redis (if REDIS_URL exists)
 */
export function connectRedis() {
  const url = config.redis.url;

  if (!url) {
    console.warn('⚠️  No REDIS_URL found. Redis features will be disabled.');
    return null;
  }

  console.log('🔌 Connecting to Redis...');

  redisClient = new Redis(url, {
    retryStrategy(times) {
      // exponential backoff retry: first wait ~0.1s, then 0.2s, etc
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });

  return redisClient;
}

/**
 * Simple readiness check (used in /healthz later)
 */
export function isRedisReady() {
  if (!redisClient) return false;
  return redisClient.status === 'ready';
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    console.log('🔌 Redis connection closed');
    redisClient = null;
  }
}

export { redisClient };
