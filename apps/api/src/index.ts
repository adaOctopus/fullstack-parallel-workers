import express from "express";
import cors from "cors";
import { createServer } from "http";
import { connectDatabase } from "./config/database";
import { getRedisClient } from "./config/redis";
import jobsRouter from "./routes/jobs";
import { WSServer, setGlobalWSServer } from "./websocket/websocket";
// import { authHandler } from "./config/auth";

const app = express();
const PORT = process.env.API_PORT || 3001;

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
    await getRedisClient();
    
    const server = createServer(app);
    
    server.listen(PORT, () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
    });

    // WebSocket server (using same HTTP server for upgrade)
    const wss = new WSServer(server);
    setGlobalWSServer(wss);
    console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);

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
