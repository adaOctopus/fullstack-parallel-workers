import { z } from "zod";

// Type-Safe Boundaries: Using Zod for runtime validation at API boundaries
export const ComputeRequestSchema = z.object({
  numberA: z.number().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER),
  numberB: z.number().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER),
});

export const JobResultSchema = z.object({
  operation: z.enum(["add", "subtract", "multiply", "divide"]),
  result: z.number().nullable(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  error: z.string().optional(),
});

export const JobSchema = z.object({
  id: z.string(),
  numberA: z.number(),
  numberB: z.number(),
  results: z.array(JobResultSchema),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ComputeRequest = z.infer<typeof ComputeRequestSchema>;
export type JobResult = z.infer<typeof JobResultSchema>;
export type Job = z.infer<typeof JobSchema>;
