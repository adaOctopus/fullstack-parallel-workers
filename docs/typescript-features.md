# Advanced TypeScript Features

This document explains the advanced TypeScript concepts used throughout the codebase.

## 1. Type-Safe Boundaries (unknown + Schema Validation)

**Location**: `packages/shared/src/utils.ts`, `apps/api/src/routes/jobs.ts`

**Concept**: Validate `unknown` input at API boundaries using Zod schemas.

**Example**:
```typescript
export function validateComputeRequest(input: unknown): ComputeRequest {
  return ComputeRequestSchema.parse(input);
}
```

**Why**: Prevents runtime errors by validating external data before use.

## 2. Discriminated Unions

**Location**: `packages/shared/src/types.ts`

**Concept**: Use discriminated unions for state modeling and domain types.

**Example**:
```typescript
export type JobState =
  | { status: "pending"; progress: 0 }
  | { status: "processing"; progress: number; completed: number; total: 4 }
  | { status: "completed"; progress: 100; results: OperationResult[] }
  | { status: "failed"; progress: number; error: string };
```

**Why**: TypeScript can narrow types based on the discriminator (`status`), ensuring type safety.

## 3. Generics with Constraints

**Location**: `apps/api/src/services/jobService.ts`

**Concept**: Use generics with constraints for scalable infrastructure.

**Example**:
```typescript
export interface JobService<T extends JobDocument = JobDocument> {
  createJob(numberA: number, numberB: number): Promise<T>;
  getJobById(id: string): Promise<T | null>;
}
```

**Why**: Allows type-safe service interfaces that work with different document types.

## 4. Conditional Types

**Location**: `packages/shared/src/types.ts`, `packages/shared/src/utils.ts`

**Concept**: Use conditional types for type-level logic and inference.

**Example**:
```typescript
export type ApiResponse<T> = T extends Error
  ? { success: false; error: string }
  : { success: true; data: T };

export type ExtractData<T> = T extends SafeApiResponse<infer D> ? D : never;
```

**Why**: Automatically infers correct return types based on input types.

## 5. Mapped Types & Template Literal Types

**Location**: `packages/shared/src/types.ts`, `packages/shared/src/utils.ts`

**Concept**: Zero duplication, synchronized types.

**Example**:
```typescript
export type OperationConfig = {
  [K in OperationType]: {
    symbol: string;
    compute: (a: number, b: number) => Promise<number>;
  };
};

export type ApiRoute<T extends string> = `/api/${T}`;
```

**Why**: Automatically generates types from existing types, keeping them in sync.

## Benefits

- **Type Safety**: Catch errors at compile time
- **Maintainability**: Types document the code
- **Scalability**: Patterns work across the codebase
- **Developer Experience**: Better autocomplete and error messages
