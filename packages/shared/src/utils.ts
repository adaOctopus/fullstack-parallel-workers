import { ComputeRequestSchema, JobSchema } from "./schemas";
import type { ComputeRequest, Job } from "./schemas";

// Type-Safe Boundaries: Validating unknown input at API edges
export function validateComputeRequest(input: unknown): ComputeRequest {
  return ComputeRequestSchema.parse(input);
}

export function validateJob(input: unknown): Job {
  return JobSchema.parse(input);
}

// Generic with Constraints for safe API responses
export type SafeApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: number };

export function createSuccessResponse<T>(data: T): SafeApiResponse<T> {
  return { success: true, data };
}

export function createErrorResponse(error: string, code?: number): SafeApiResponse<never> {
  return { success: false, error, code };
}

// Conditional Types for extracting data from SafeApiResponse
export type ExtractData<T> = T extends SafeApiResponse<infer D> ? D : never;

// Mapped Types utility for operation symbols
export const OPERATION_SYMBOLS: Record<"add" | "subtract" | "multiply" | "divide", string> = {
  add: "+",
  subtract: "-",
  multiply: "*",
  divide: "/",
} as const;
