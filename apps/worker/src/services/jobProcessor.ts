import mongoose from "mongoose";
import { createClient } from "redis";
import { Job } from "../models/Job";
import { llmService } from "./llmService";
import type { OperationType, WSMessage } from "@emma/shared";

// Job processor with parallel execution support
export class JobProcessor {
  private redisClient: ReturnType<typeof createClient> | null = null;
  private processingJobs: Set<string> = new Set();
  private readonly REDIS_CHANNEL = "job-updates";

  constructor() {
    this.connectRedis();
  }

  private async connectRedis(): Promise<void> {
    try {
      const url = process.env.REDIS_URL || "redis://localhost:6379";
      this.redisClient = createClient({ url });
      
      this.redisClient.on("error", (err) => console.error("Redis Client Error", err));
      await this.redisClient.connect();
      console.log("✅ Worker connected to Redis");
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      setTimeout(() => this.connectRedis(), 3000);
    }
  }

  private async broadcast(message: WSMessage): Promise<void> {
    if (this.redisClient?.isOpen) {
      try {
        await this.redisClient.publish(this.REDIS_CHANNEL, JSON.stringify(message));
      } catch (error) {
        console.error("Error publishing to Redis:", error);
      }
    }
  }

  // Process a single operation with 3-second delay
  private async processOperation(
    jobId: string,
    operation: OperationType,
    a: number,
    b: number
  ): Promise<number> {
    // Update status to processing
    await Job.findByIdAndUpdate(jobId, {
      $set: {
        "results.$[elem].status": "processing",
      },
    }, {
      arrayFilters: [{ "elem.operation": operation }],
    });

    // Simulate 3-second delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Use LLM for computation
    const { result } = await llmService.compute(operation, a, b);

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
      return; // Already processing
    }

    this.processingJobs.add(jobId);

    try {
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Update job status
      await Job.findByIdAndUpdate(jobId, { status: "processing" });
      await this.broadcast({ type: "job_created", jobId });

      const { numberA, numberB } = job;
      const operations: OperationType[] = ["add", "subtract", "multiply", "divide"];

      // Process all operations in parallel
      const promises = operations.map(async (operation, index) => {
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

      for (const job of pendingJobs) {
        // Process jobs in parallel (up to 5)
        this.processJob(job._id.toString()).catch(console.error);
      }
    } catch (error) {
      console.error("Error polling for jobs:", error);
    }
  }

  start(): void {
    console.log("🚀 Worker started, polling for jobs...");
    // Poll every 2 seconds
    setInterval(() => this.pollForJobs(), 2000);
  }
}
