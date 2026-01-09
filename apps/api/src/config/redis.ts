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

  // If we already tried and failed, don't retry immediately
  if (redisClient && !redisClient.isOpen && !redisEnabled) {
    return null;
  }

  try {
    // Check if URL is Upstash REST URL (starts with https://) - need Redis protocol URL
    if (url.startsWith("https://")) {
      console.error("❌ REDIS_URL appears to be a REST URL. Redis client needs Redis protocol URL.");
      console.error("   Upstash provides both REST URL and Redis URL - use the Redis URL (starts with redis:// or rediss://)");
      console.log("⚠️  Continuing without Redis - using WebSocket fallback");
      redisEnabled = false;
      return null;
    }

    redisClient = createClient({ 
      url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log("⚠️  Redis reconnection failed after 3 attempts - disabling Redis");
            redisEnabled = false;
            return false; // Stop reconnecting
          }
          return Math.min(retries * 100, 3000); // Exponential backoff
        },
      },
    });
    
    redisClient.on("error", (err) => {
      // Only log first error, then silence
      if (redisEnabled) {
        console.error("Redis Client Error:", err.message);
        redisEnabled = false;
      }
    });
    
    redisClient.on("connect", () => {
      console.log("✅ Connected to Redis");
      redisEnabled = true;
    });

    await redisClient.connect();
    redisEnabled = true;
    return redisClient;
  } catch (error) {
    console.error("⚠️  Failed to connect to Redis:", error instanceof Error ? error.message : error);
    console.log("⚠️  Continuing without Redis - caching disabled");
    redisEnabled = false;
    redisClient = null;
    return null;
  }
}

export async function getRedisSubscriber(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }

  // Don't try if main client failed
  if (!redisEnabled) {
    return null;
  }

  if (redisSubscriber && redisSubscriber.isOpen) {
    return redisSubscriber;
  }

  try {
    redisSubscriber = createClient({ 
      url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            return false; // Stop reconnecting
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });
    
    redisSubscriber.on("error", (err) => {
      // Silently handle errors - don't spam console
      if (redisSubscriber) {
        redisSubscriber.quit().catch(() => {});
        redisSubscriber = null;
      }
    });
    
    await redisSubscriber.connect();
    console.log("✅ Redis subscriber connected");
    return redisSubscriber;
  } catch (error) {
    console.error("⚠️  Failed to connect Redis subscriber:", error instanceof Error ? error.message : error);
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
