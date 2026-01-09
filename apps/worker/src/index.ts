import mongoose from "mongoose";
import { JobProcessor } from "./services/jobProcessor";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Worker connected to MongoDB");

    const processor = new JobProcessor();
    processor.start();
  } catch (error) {
    console.error("Failed to start worker:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await mongoose.disconnect();
  process.exit(0);
});

start();
