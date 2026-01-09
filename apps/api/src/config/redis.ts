import { createClient, type RedisClientType } from "redis";

// Redis client with type-safe configuration and graceful fallback
let redisClient: RedisClientType | null = null;
let redisSubscriber: RedisClientType | null = null;
let redisEnabled = false;

export function isRedisEnabled(): boolean {
  return redisEnabled;
}

export async function getRedisClient(): Promise<RedisClientType | null> {
  // If Redis URL not provided, return null (graceful fallback)
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log("⚠️  REDIS_URL not set - Redis features disabled (caching & pub/sub)");
    return null;
  }

  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  try {
    redisClient = createClient({ url });
    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
      redisEnabled = false;
    });
    redisClient.on("connect", () => {
      console.log("✅ Connected to Redis");
      redisEnabled = true;
    });

    await redisClient.connect();
    redisEnabled = true;
    return redisClient;
  } catch (error) {
    console.error("⚠️  Failed to connect to Redis:", error);
    console.log("⚠️  Continuing without Redis - caching disabled");
    redisEnabled = false;
    return null;
  }
}

export async function getRedisSubscriber(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }

  if (redisSubscriber && redisSubscriber.isOpen) {
    return redisSubscriber;
  }

  try {
    redisSubscriber = createClient({ url });
    redisSubscriber.on("error", (err) => {
      console.error("Redis Subscriber Error:", err);
    });
    await redisSubscriber.connect();
    console.log("✅ Redis subscriber connected");
    return redisSubscriber;
  } catch (error) {
    console.error("⚠️  Failed to connect Redis subscriber:", error);
    return null;
  }
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (error) {
      // Ignore errors on close
    }
    redisClient = null;
  }
  if (redisSubscriber) {
    try {
      await redisSubscriber.quit();
    } catch (error) {
      // Ignore errors on close
    }
    redisSubscriber = null;
  }
  redisEnabled = false;
  console.log("Disconnected from Redis");
}
