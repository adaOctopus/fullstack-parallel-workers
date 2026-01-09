# TypeScript Advanced Concepts - Code Examples

This document provides concrete examples of advanced TypeScript concepts used in the codebase.

## 1. Type-Safe Boundaries

**File**: `packages/shared/src/utils.ts`

```typescript
// Validate unknown input at API boundaries
export function validateComputeRequest(input: unknown): ComputeRequest {
  return ComputeRequestSchema.parse(input);
}
```

**Usage**: `apps/api/src/routes/jobs.ts`
```typescript
router.post("/", async (req: Request, res: Response) => {
  // Validate unknown request body
  const validated = validateComputeRequest(req.body);
  // Now TypeScript knows validated is ComputeRequest
});
```

## 2. Discriminated Unions

**File**: `packages/shared/src/types.ts`

```typescript
// Discriminated union for job state
export type JobState =
  | { status: "pending"; progress: 0 }
  | { status: "processing"; progress: number; completed: number; total: 4 }
  | { status: "completed"; progress: 100; results: OperationResult[] }
  | { status: "failed"; progress: number; error: string };

// TypeScript narrows based on status
function handleJobState(state: JobState) {
  if (state.status === "completed") {
    // TypeScript knows state.results exists here
    console.log(state.results);
  } else if (state.status === "failed") {
    // TypeScript knows state.error exists here
    console.log(state.error);
  }
}
```

## 3. Generics with Constraints

**File**: `apps/api/src/services/jobService.ts`

```typescript
// Generic interface with constraint
export interface JobService<T extends JobDocument = JobDocument> {
  createJob(numberA: number, numberB: number): Promise<T>;
  getJobById(id: string): Promise<T | null>;
}

// Implementation
class JobServiceImpl implements JobService<JobDocument> {
  async createJob(numberA: number, numberB: number): Promise<JobDocument> {
    // Implementation
  }
}
```

## 4. Conditional Types

**File**: `packages/shared/src/utils.ts`

```typescript
// Conditional type for API responses
export type SafeApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: number };

// Extract data type from response
export type ExtractData<T> = T extends SafeApiResponse<infer D> ? D : never;

// Usage
type JobResponse = SafeApiResponse<{ id: string }>;
type JobData = ExtractData<JobResponse>; // { id: string }
```

## 5. Mapped Types

**File**: `packages/shared/src/types.ts`

```typescript
// Mapped type for operation configuration
export type OperationConfig = {
  [K in OperationType]: {
    symbol: string;
    compute: (a: number, b: number) => Promise<number>;
  };
};

// Automatically creates:
// {
//   add: { symbol: string; compute: ... },
//   subtract: { symbol: string; compute: ... },
//   multiply: { symbol: string; compute: ... },
//   divide: { symbol: string; compute: ... }
// }
```

## 6. Template Literal Types

**File**: `packages/shared/src/types.ts`

```typescript
// Template literal type for routes
export type ApiRoute<T extends string> = `/api/${T}`;

// Usage
type JobsRoute = ApiRoute<"jobs">; // "/api/jobs"
type JobByIdRoute = ApiRoute<`jobs/${string}`>; // "/api/jobs/${string}"
```

## Real-World Benefits

1. **Type-Safe Boundaries**: Prevents invalid data from entering the system
2. **Discriminated Unions**: Eliminates null checks and type assertions
3. **Generics with Constraints**: Reusable, type-safe service interfaces
4. **Conditional Types**: Automatic type inference reduces boilerplate
5. **Mapped Types**: Keeps related types synchronized automatically

These patterns make the codebase more maintainable, scalable, and less prone to runtime errors.
