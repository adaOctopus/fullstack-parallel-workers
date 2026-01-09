import dotenv from "dotenv";
import { resolve, join } from "path";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { connectDatabase } from "./config/database";
import { getRedisClient, getRedisSubscriber } from "./config/redis";
import jobsRouter from "./routes/jobs";
import { WSServer, setGlobalWSServer } from "./websocket/websocket";
import type { WSMessage } from "@emma/shared";

// Load .env from root directory
// Try multiple paths to find .env file
const possiblePaths = [
  resolve(process.cwd(), ".env"),           // Root when running from root
  resolve(__dirname, "../../../.env"),      // From compiled dist
  resolve(__dirname, "../../.env"),          // From src
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log(`✅ Loaded .env from: ${envPath}`);
      envLoaded = true;
      break;
    }
  } catch (e) {
    // Try next path
  }
}

if (!envLoaded) {
  console.error("❌ Could not find .env file. Tried paths:", possiblePaths);
  console.error("Current working directory:", process.cwd());
  console.error("__dirname:", __dirname);
}

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
    console.log("🔧 Starting API server...");
    console.log(`📝 Environment check: MONGODB_URI=${process.env.MONGODB_URI ? "✅ Set" : "❌ Missing"}`);
    
    // Connect to MongoDB first (required)
    try {
      await connectDatabase();
    } catch (error) {
      console.error("❌ MongoDB connection failed - server cannot start without database");
      console.error("Please check your MONGODB_URI in .env file");
      process.exit(1);
    }
    
    // Try to connect Redis (optional - won't crash if unavailable)
    await getRedisClient();
    
    // Create HTTP server
    const server = createServer(app);
    
    // WebSocket server (using same HTTP server for upgrade)
    const wss = new WSServer(server);
    setGlobalWSServer(wss);
    
    // Start listening after everything is set up
    server.listen(PORT, () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
    });

    // Subscribe to Redis pub/sub and broadcast to WebSocket clients (if Redis available)
    const subscriber = await getRedisSubscriber();
    if (subscriber) {
      try {
        await subscriber.subscribe(REDIS_CHANNEL, (message, channel) => {
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
    console.error("❌ Failed to start server:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

start();
