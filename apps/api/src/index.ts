import express from "express";
import cors from "cors";
import { createServer } from "http";
import { connectDatabase } from "./config/database";
import { getRedisClient, getRedisSubscriber } from "./config/redis";
import jobsRouter from "./routes/jobs";
import { WSServer, setGlobalWSServer } from "./websocket/websocket";
import type { WSMessage } from "@emma/shared";
// import { authHandler } from "./config/auth";

const app = express();
const PORT = process.env.API_PORT || 3001;
const REDIS_CHANNEL = "job-updates";

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Auth routes (commented out until Prisma/MongoDB adapter is configured)
// app.all("/api/auth/*", authHandler);

// Routes
app.use("/api/jobs", jobsRouter);

// Initialize services
async function start() {
  try {
    await connectDatabase();
    
    // Try to connect Redis (optional - won't crash if unavailable)
    await getRedisClient();
    
    const server = createServer(app);
    
    server.listen(PORT, () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
    });

    // WebSocket server (using same HTTP server for upgrade)
    const wss = new WSServer(server);
    setGlobalWSServer(wss);
    console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);

    // Subscribe to Redis pub/sub and broadcast to WebSocket clients (if Redis available)
    const subscriber = await getRedisSubscriber();
    if (subscriber) {
      try {
        await subscriber.subscribe(REDIS_CHANNEL);
        subscriber.on("message", (channel, message) => {
          if (channel === REDIS_CHANNEL) {
            try {
              const wsMessage: WSMessage = JSON.parse(message);
              wss.broadcast(wsMessage);
            } catch (error) {
              console.error("Error parsing Redis message:", error);
            }
          }
        });
        console.log(`📡 Subscribed to Redis channel: ${REDIS_CHANNEL}`);
      } catch (error) {
        console.error("⚠️  Failed to subscribe to Redis:", error);
        console.log("⚠️  Real-time updates will work via direct WebSocket (if worker supports it)");
      }
    } else {
      console.log("⚠️  Redis not available - pub/sub disabled");
      console.log("⚠️  Note: Worker needs to connect directly to WebSocket for real-time updates");
    }

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM received, shutting down gracefully");
      server.close();
      wss.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
