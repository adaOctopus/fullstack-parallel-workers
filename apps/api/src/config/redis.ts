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

    // Upstash requires TLS - convert redis:// to rediss:// if needed
    let redisUrl = url;
    if (url.includes("upstash.io") && url.startsWith("redis://")) {
      redisUrl = url.replace("redis://", "rediss://");
      console.log("🔒 Converting Redis URL to TLS (rediss://) for Upstash");
    }

    redisClient = createClient({ 
      url: redisUrl,
      socket: {
        connectTimeout: 10000, // 10 seconds
        keepAlive: 30000, // 30 seconds
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.log("⚠️  Redis reconnection failed after 10 attempts");
            redisEnabled = false;
            return false; // Stop reconnecting
          }
          const delay = Math.min(retries * 200, 5000); // Max 5 seconds
          console.log(`🔄 Redis reconnecting (attempt ${retries}) in ${delay}ms...`);
          return delay;
        },
      },
    });
    
    // Critical: Add error listener to prevent crashes
    redisClient.on("error", (err) => {
      // Log error but don't crash - this prevents "Socket closed unexpectedly" from killing the app
      console.error("Redis Client Error:", err.message);
      // Don't immediately disable - let reconnect strategy handle it
    });
    
    redisClient.on("connect", () => {
      console.log("✅ Redis client connecting...");
    });
    
    redisClient.on("ready", () => {
      console.log("✅ Redis client ready and connected");
      redisEnabled = true;
    });
    
    redisClient.on("end", () => {
      console.log("⚠️  Redis connection ended");
      redisEnabled = false;
    });
    
    redisClient.on("reconnecting", (delay) => {
      console.log(`🔄 Redis reconnecting in ${delay}ms...`);
    });

    console.log("🔌 Connecting to Redis...");
    await redisClient.connect();
    console.log("✅ Redis client connected successfully");
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
    // Upstash requires TLS - convert redis:// to rediss:// if needed
    let redisUrl = url;
    if (url.includes("upstash.io") && url.startsWith("redis://")) {
      redisUrl = url.replace("redis://", "rediss://");
    }

    redisSubscriber = createClient({ 
      url: redisUrl,
      socket: {
        connectTimeout: 10000, // 10 seconds
        keepAlive: 30000, // 30 seconds
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return false; // Stop reconnecting
          }
          const delay = Math.min(retries * 200, 5000); // Max 5 seconds
          return delay;
        },
      },
    });
    
    // Critical: Add error listener to prevent crashes
    redisSubscriber.on("error", (err) => {
      // Log error but don't crash - prevents "Socket closed unexpectedly" from killing the app
      console.error("Redis Subscriber Error:", err.message);
      // Don't quit immediately - let it try to reconnect
    });
    
    redisSubscriber.on("connect", () => {
      console.log("✅ Redis subscriber connecting...");
    });
    
    redisSubscriber.on("ready", () => {
      console.log("✅ Redis subscriber ready and connected");
    });
    
    redisSubscriber.on("end", () => {
      console.log("⚠️  Redis subscriber connection ended");
    });
    
    redisSubscriber.on("reconnecting", (delay) => {
      console.log(`🔄 Redis subscriber reconnecting in ${delay}ms...`);
    });
    
    console.log("🔌 Connecting Redis subscriber...");
    await redisSubscriber.connect();
    console.log("✅ Redis subscriber connected successfully");
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
