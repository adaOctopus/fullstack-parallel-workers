import dotenv from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";
import { createClient } from "redis";
import WebSocket from "ws";
import { Job } from "../models/Job";
import type { OperationType, WSMessage } from "@emma/shared";

// Load .env BEFORE importing llmService (which needs OPENAI_API_KEY)
const possiblePaths = [
  resolve(process.cwd(), ".env"),
  resolve(__dirname, "../../../.env"),
  resolve(__dirname, "../../.env"),
];

for (const envPath of possiblePaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      break;
    }
  } catch (e) {
    // Try next path
  }
}

// Import llmService AFTER loading env
import { llmService } from "./llmService";

// Job processor with parallel execution support
export class JobProcessor {
  private redisClient: ReturnType<typeof createClient> | null = null;
  private wsClient: WebSocket | null = null;
  private processingJobs: Set<string> = new Set();
  private readonly REDIS_CHANNEL = "job-updates";

  constructor() {
    this.connectRedis();
    this.connectWebSocket(); // Always connect WebSocket as fallback
  }

  private async connectRedis(): Promise<void> {
    const url = process.env.REDIS_URL;
    if (!url) {
      console.log("⚠️  REDIS_URL not set - worker will use direct WebSocket");
      return;
    }

    try {
      // Check if URL is Upstash REST URL (starts with https://) - need Redis protocol URL
      if (url.startsWith("https://")) {
        console.error("❌ REDIS_URL appears to be a REST URL. Redis client needs Redis protocol URL (redis:// or rediss://)");
        console.log("⚠️  Worker will use WebSocket fallback instead");
        return;
      }

      this.redisClient = createClient({ 
        url,
        socket: {
          reconnectStrategy: false, // Don't auto-reconnect, use WebSocket fallback
        },
      });
      
      this.redisClient.on("error", () => {
        // Silently fail, WebSocket will handle it
        this.redisClient = null;
      });
      
      await this.redisClient.connect();
      console.log("✅ Worker connected to Redis");
    } catch (error) {
      console.error("⚠️  Failed to connect to Redis:", error instanceof Error ? error.message : error);
      console.log("⚠️  Worker will use WebSocket fallback");
      this.redisClient = null;
    }
  }

  private connectWebSocket(): void {
    const wsUrl = process.env.WS_URL || "ws://localhost:3001";
    console.log(`🔌 Worker connecting to WebSocket at ${wsUrl}...`);
    
    try {
      this.wsClient = new WebSocket(wsUrl);
      
      this.wsClient.on("open", () => {
        console.log("✅ Worker connected to WebSocket server - ready to send updates");
      });
      
      this.wsClient.on("error", (error) => {
        console.error("❌ Worker WebSocket error:", error);
      });
      
      this.wsClient.on("close", () => {
        console.log("⚠️  Worker WebSocket closed, reconnecting in 3 seconds...");
        this.wsClient = null;
        setTimeout(() => this.connectWebSocket(), 3000);
      });
    } catch (error) {
      console.error("❌ Failed to create WebSocket:", error);
      setTimeout(() => this.connectWebSocket(), 3000);
    }
  }

  private async broadcast(message: WSMessage): Promise<void> {
    // Try Redis first (preferred for scalability)
    if (this.redisClient?.isOpen) {
      try {
        await this.redisClient.publish(this.REDIS_CHANNEL, JSON.stringify(message));
        console.log(`📤 Broadcast via Redis: ${message.type} for job ${message.jobId}`);
        return;
      } catch (error) {
        console.log("Redis publish failed, using WebSocket fallback");
        // Fall through to WebSocket fallback
      }
    }
    
    // Fallback: Direct WebSocket connection
    if (this.wsClient?.readyState === WebSocket.OPEN) {
      try {
        this.wsClient.send(JSON.stringify(message));
        console.log(`📤 Broadcast via WebSocket: ${message.type} for job ${message.jobId}`);
      } catch (error) {
        console.error("❌ Error sending via WebSocket:", error);
      }
    } else {
      console.warn(`⚠️  Cannot broadcast ${message.type}: WebSocket not connected (state: ${this.wsClient?.readyState})`);
    }
  }

  // Process a single operation with 3-second delay
  private async processOperation(
    jobId: string,
    operation: OperationType,
    a: number,
    b: number
  ): Promise<number> {
    console.log(`  ⚙️  Processing ${operation} for job ${jobId}...`);
    
    // Update status to processing
    await Job.findByIdAndUpdate(jobId, {
      $set: {
        "results.$[elem].status": "processing",
      },
    }, {
      arrayFilters: [{ "elem.operation": operation }],
    });

    // Simulate 3-second delay
    console.log(`  ⏳ Waiting 3 seconds for ${operation}...`);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Use LLM for computation
    console.log(`  🤖 Calling LLM for ${operation}...`);
    const { result } = await llmService.compute(operation, a, b);
    console.log(`  ✅ ${operation} result: ${result}`);

    // Update job with result
    await Job.findByIdAndUpdate(jobId, {
      $set: {
        "results.$[elem].status": "completed",
        "results.$[elem].result": result,
      },
    }, {
      arrayFilters: [{ "elem.operation": operation }],
    });

    // Broadcast completion
    await this.broadcast({
      type: "operation_complete",
      jobId,
      operation,
      result,
    });

    return result;
  }

  // Process a job with parallel operations
  async processJob(jobId: string): Promise<void> {
    if (this.processingJobs.has(jobId)) {
      console.log(`⏭️  Job ${jobId} already processing, skipping...`);
      return; // Already processing
    }

    this.processingJobs.add(jobId);
    console.log(`🔄 Starting to process job ${jobId}...`);

    try {
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      console.log(`📊 Job ${jobId}: Computing ${job.numberA} and ${job.numberB}`);

      // Update job status
      await Job.findByIdAndUpdate(jobId, { status: "processing" });
      await this.broadcast({ type: "job_created", jobId });

      const { numberA, numberB } = job;
      const operations: OperationType[] = ["add", "subtract", "multiply", "divide"];

      // Process all operations in parallel
      const promises = operations.map(async (operation, index) => {
        try {
          const result = await this.processOperation(jobId, operation, numberA, numberB);

          // Broadcast progress after each operation
          await this.broadcast({
            type: "job_progress",
            jobId,
            progress: ((index + 1) / operations.length) * 100,
            completed: index + 1,
            total: operations.length,
          });

          return result;
        } catch (error) {
          console.error(`❌ Error processing operation ${operation}:`, error);
          // Mark this operation as failed
          await Job.findByIdAndUpdate(jobId, {
            $set: {
              "results.$[elem].status": "failed",
            },
          }, {
            arrayFilters: [{ "elem.operation": operation }],
          });
          throw error;
        }
      });

      await Promise.all(promises);

      // Get final job state
      const finalJob = await Job.findById(jobId);
      if (!finalJob) throw new Error("Job not found after processing");

      // Mark job as completed
      await Job.findByIdAndUpdate(jobId, { status: "completed" });
      await this.broadcast({
        type: "job_complete",
        jobId,
        results: finalJob.results.map((r) => ({
          operation: r.operation as OperationType,
          status: r.status,
          ...(r.result !== null && { result: r.result }),
        })) as any,
      });

      console.log(`✅ Job ${jobId} completed`);
    } catch (error) {
      console.error(`❌ Error processing job ${jobId}:`, error);
      await Job.findByIdAndUpdate(jobId, {
        status: "failed",
      });
      await this.broadcast({
        type: "error",
        jobId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      this.processingJobs.delete(jobId);
    }
  }

  // Poll for pending jobs
  async pollForJobs(): Promise<void> {
    try {
      const pendingJobs = await Job.find({ status: "pending" }).limit(5); // Process up to 5 jobs in parallel
      
      if (pendingJobs.length > 0) {
        console.log(`📋 Found ${pendingJobs.length} pending job(s), processing...`);
      }

      for (const job of pendingJobs) {
        // Process jobs in parallel (up to 5)
        this.processJob(job._id.toString()).catch((error) => {
          console.error(`❌ Failed to process job ${job._id}:`, error);
        });
      }
    } catch (error) {
      console.error("❌ Error polling for jobs:", error);
    }
  }

  start(): void {
    console.log("🚀 Worker started, polling for jobs every 2 seconds...");
    // Poll immediately, then every 2 seconds
    this.pollForJobs();
    setInterval(() => this.pollForJobs(), 2000);
  }
}
