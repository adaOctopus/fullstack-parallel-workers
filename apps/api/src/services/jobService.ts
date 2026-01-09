import { Job, type JobDocument } from "../models/Job";
import type { OperationType } from "@emma/shared";
import { getRedisClient } from "../config/redis";

// Generic with Constraints for job operations
export interface JobService<T extends JobDocument = JobDocument> {
  createJob(numberA: number, numberB: number): Promise<T>;
  getJobById(id: string): Promise<T | null>;
  updateJobStatus(id: string, status: string): Promise<T | null>;
  updateOperationResult(
    id: string,
    operation: OperationType,
    result: number | null,
    status: string,
    error?: string
  ): Promise<T | null>;
}

// Implementation using generics with constraints
class JobServiceImpl implements JobService<JobDocument> {
  async createJob(numberA: number, numberB: number): Promise<JobDocument> {
    const job = new Job({
      numberA,
      numberB,
      results: [
        { operation: "add", status: "pending" },
        { operation: "subtract", status: "pending" },
        { operation: "multiply", status: "pending" },
        { operation: "divide", status: "pending" },
      ],
      status: "pending",
    });

    await job.save();
    return job;
  }

  async getJobById(id: string): Promise<JobDocument | null> {
    return Job.findById(id);
  }

  async updateJobStatus(id: string, status: string): Promise<JobDocument | null> {
    return Job.findByIdAndUpdate(id, { status }, { new: true });
  }

  async updateOperationResult(
    id: string,
    operation: OperationType,
    result: number | null,
    status: string,
    error?: string
  ): Promise<JobDocument | null> {
    const job = await Job.findById(id);
    if (!job) return null;

    const resultIndex = job.results.findIndex((r) => r.operation === operation);
    if (resultIndex !== -1) {
      job.results[resultIndex] = {
        operation,
        result,
        status: status as any,
        ...(error && { error }),
      };
    }

    await job.save();
    return job;
  }

  // Cache job in Redis (graceful fallback if Redis unavailable)
  async cacheJob(jobId: string, job: JobDocument): Promise<void> {
    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.setEx(`job:${jobId}`, 3600, JSON.stringify(job));
      }
    } catch (error) {
      // Silently fail - caching is optional
      console.debug("Redis cache unavailable, skipping cache");
    }
  }

  async getCachedJob(jobId: string): Promise<JobDocument | null> {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const cached = await redis.get(`job:${jobId}`);
        return cached ? JSON.parse(cached) : null;
      }
    } catch (error) {
      // Silently fail - caching is optional
    }
    return null;
  }
}

export const jobService = new JobServiceImpl();
