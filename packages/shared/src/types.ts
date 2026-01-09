// Discriminated Unions for domain modeling
export type OperationType = "add" | "subtract" | "multiply" | "divide";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

// Discriminated Union for Job State
export type JobState =
  | { status: "pending"; progress: 0 }
  | { status: "processing"; progress: number; completed: number; total: 4 }
  | { status: "completed"; progress: 100; results: OperationResult[] }
  | { status: "failed"; progress: number; error: string };

// Operation Result with discriminated union
export type OperationResult =
  | { operation: OperationType; status: "pending" }
  | { operation: OperationType; status: "processing" }
  | { operation: OperationType; status: "completed"; result: number }
  | { operation: OperationType; status: "failed"; error: string };

// WebSocket Message Types (Discriminated Union)
export type WSMessage =
  | { type: "job_created"; jobId: string }
  | { type: "job_progress"; jobId: string; progress: number; completed: number; total: number }
  | { type: "operation_complete"; jobId: string; operation: OperationType; result: number }
  | { type: "job_complete"; jobId: string; results: OperationResult[] }
  | { type: "error"; jobId: string; error: string };

// Conditional Types for API Response inference
export type ApiResponse<T> = T extends Error
  ? { success: false; error: string }
  : { success: true; data: T };

// Mapped Types for Operation Configurations
export type OperationConfig = {
  [K in OperationType]: {
    symbol: string;
    compute: (a: number, b: number) => Promise<number>;
  };
};

// Template Literal Types for route generation
export type ApiRoute<T extends string> = `/api/${T}`;
export type JobRoute = ApiRoute<"jobs"> | ApiRoute<"jobs/${string}">;
