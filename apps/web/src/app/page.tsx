"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { WelcomeModal } from "@/components/WelcomeModal";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { OperationResult, OperationType } from "@emma/shared";

// Main page component with form, progress tracking, and results display
export default function Home() {
  const [numberA, setNumberA] = useState("");
  const [numberB, setNumberB] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [results, setResults] = useState<Map<OperationType, OperationResult>>(new Map());
  const [progress, setProgress] = useState(0);
  const [isComputing, setIsComputing] = useState(false);

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Deconstruct websocket hook
  const { messages, isConnected } = useWebSocket(wsUrl);

  // Process WebSocket messages
  useEffect(() => {
    if (!jobId) return;
    console.log("Processing WebSocket messages at instant zero:", messages);
    messages.forEach((message) => {
      if (message.jobId !== jobId) return;

      switch (message.type) {
        case "job_progress":
          setProgress((message.completed / message.total) * 100);
          break;
        case "operation_complete":
          setResults((prev) => {
            const newResults = new Map(prev);
            newResults.set(message.operation, {
              operation: message.operation,
              status: "completed",
              result: message.result,
            });
            return newResults;
          });
          break;
        case "job_complete":
          setIsComputing(false);
          setProgress(100);
          break;
        case "error":
          setIsComputing(false);
          console.error("Job error:", message.error);
          break;
      }
    });
  }, [messages, jobId]);

  const handleCompute = async () => {
    const a = parseFloat(numberA);
    const b = parseFloat(numberB);

    if (isNaN(a) || isNaN(b)) {
      alert("Please enter valid numbers");
      return;
    }

    setIsComputing(true);
    setProgress(0);
    setResults(new Map());
    setJobId(null);

    try {
      const response = await fetch(`${apiUrl}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberA: a, numberB: b }),
      });

      if (!response.ok) throw new Error("Failed to create job");

      const data = await response.json();
      setJobId(data.data.id);

      // Initialize results
      const initialResults = new Map<OperationType, OperationResult>([
        ["add", { operation: "add", status: "pending" }],
        ["subtract", { operation: "subtract", status: "pending" }],
        ["multiply", { operation: "multiply", status: "pending" }],
        ["divide", { operation: "divide", status: "pending" }],
      ]);
      setResults(initialResults);
    } catch (error) {
      console.error("Error creating job:", error);
      setIsComputing(false);
      alert("Failed to start computation");
    }
  };

  const operationLabels = useMemo(
    () => ({
      add: "A + B",
      subtract: "A - B",
      multiply: "A * B",
      divide: "A / B",
    }),
    []
  );

  const completedCount = useMemo(
    () => Array.from(results.values()).filter((r) => r.status === "completed").length,
    [results]
  );

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8 md:p-12">
      <WelcomeModal />
      
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Emma Worker Queue
          </h1>
          <p className="text-muted-foreground">
            Enter two numbers to compute operations in real-time
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Input
              type="number"
              placeholder="Enter number A"
              value={numberA}
              onChange={(e) => setNumberA(e.target.value)}
              disabled={isComputing}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Enter number B"
              value={numberB}
              onChange={(e) => setNumberB(e.target.value)}
              disabled={isComputing}
              className="flex-1"
            />
            <Button
              onClick={handleCompute}
              disabled={isComputing || !isConnected}
              className="sm:w-auto"
            >
              {isComputing ? "Computing..." : "Compute"}
            </Button>
          </div>

          {isComputing && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Computing... {completedCount} out of 4 jobs finished
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {results.size > 0 && (
            <div className="mt-6 space-y-2">
              {Array.from(results.entries()).map(([operation, result]) => (
                <div
                  key={operation}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span className="font-medium">{operationLabels[operation]}</span>
                  <span className="text-muted-foreground">
                    {result.status === "pending" && "Pending..."}
                    {result.status === "processing" && "Computing..."}
                    {result.status === "completed" && `= ${result.result}`}
                    {result.status === "failed" && `Error: ${result.error}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!isConnected && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Connecting to server...
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
