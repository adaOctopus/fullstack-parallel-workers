import dotenv from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";
import { JobProcessor } from "./services/jobProcessor";

// Load .env from root directory
// Try multiple paths to find .env file
const possiblePaths = [
  resolve(process.cwd(), ".env"),           // Root when running from root
  resolve(__dirname, "../../../.env"),       // From compiled dist
  resolve(__dirname, "../../.env"),          // From src
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log(`✅ Worker loaded .env from: ${envPath}`);
      envLoaded = true;
      break;
    }
  } catch (e) {
    // Try next path
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

async function start() {
  try {
    console.log("🔧 Worker starting...");
    console.log(`📝 Environment check: MONGODB_URI=${process.env.MONGODB_URI ? "✅ Set" : "❌ Missing"}`);
    console.log(`📝 Environment check: OPENAI_API_KEY=${process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Missing"}`);
    console.log(`📝 Environment check: WS_URL=${process.env.WS_URL || "ws://localhost:3001 (default)"}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Worker connected to MongoDB");

    const processor = new JobProcessor();
    processor.start();
    
    console.log("✅ Worker fully initialized and ready to process jobs");
  } catch (error) {
    console.error("❌ Failed to start worker:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack:", error.stack);
    }
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
