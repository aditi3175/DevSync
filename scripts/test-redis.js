import { connectRedis, isRedisReady, closeRedis } from '../src/config/redis.js';

(async () => {
  const client = connectRedis();

  // wait a small moment for Redis to connect
  setTimeout(async () => {
    console.log('Redis ready:', isRedisReady());

    if (client) {
      const pong = await client.ping();
      console.log('PING response:', pong); // should be "PONG"
    }

    await closeRedis();
  }, 500);
})();
