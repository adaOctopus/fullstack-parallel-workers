import { createClient, type RedisClientType } from "redis";

// Redis client with type-safe configuration
let redisClient: RedisClientType | null = null;
let redisSubscriber: RedisClientType | null = null;

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

export async function getRedisSubscriber(): Promise<RedisClientType> {
  if (redisSubscriber && redisSubscriber.isOpen) {
    return redisSubscriber;
  }

  const url = process.env.REDIS_URL || "redis://localhost:6379";
  redisSubscriber = createClient({ url });

  redisSubscriber.on("error", (err) => console.error("Redis Subscriber Error", err));
  await redisSubscriber.connect();
  console.log("✅ Redis subscriber connected");

  return redisSubscriber;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  if (redisSubscriber) {
    await redisSubscriber.quit();
    redisSubscriber = null;
  }
  console.log("Disconnected from Redis");
}
