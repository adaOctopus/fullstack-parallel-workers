import { createClient, type RedisClientType } from "redis";

// Redis client with type-safe configuration
let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const url = process.env.REDIS_URL || "redis://localhost:6379";
  redisClient = createClient({ url });

  redisClient.on("error", (err) => console.error("Redis Client Error", err));
  redisClient.on("connect", () => console.log("✅ Connected to Redis"));

  await redisClient.connect();
  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log("Disconnected from Redis");
  }
}
