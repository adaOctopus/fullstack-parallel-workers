import mongoose from "mongoose";
import { Job } from "../models/Job";
import { llmService } from "./llmService";
import type { OperationType, WSMessage } from "@emma/shared";
import WebSocket from "ws";

// Job processor with parallel execution support
export class JobProcessor {
  private wsClient: WebSocket | null = null;
  private processingJobs: Set<string> = new Set();

  constructor() {
    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    const wsUrl = process.env.WS_URL || "ws://localhost:3001";
    this.wsClient = new WebSocket(wsUrl);

    this.wsClient.on("open", () => {
      console.log("✅ Worker connected to WebSocket server");
    });

    this.wsClient.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    this.wsClient.on("close", () => {
      console.log("WebSocket closed, reconnecting...");
      setTimeout(() => this.connectWebSocket(), 3000);
    });
  }

  private broadcast(message: WSMessage): void {
    if (this.wsClient?.readyState === WebSocket.OPEN) {
      this.wsClient.send(JSON.stringify(message));
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
    this.broadcast({
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
      this.broadcast({ type: "job_created", jobId });

      const { numberA, numberB } = job;
      const operations: OperationType[] = ["add", "subtract", "multiply", "divide"];

      // Process all operations in parallel
      const promises = operations.map(async (operation, index) => {
        const result = await this.processOperation(jobId, operation, numberA, numberB);
        
        // Broadcast progress after each operation
        this.broadcast({
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
      this.broadcast({
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
      this.broadcast({
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
