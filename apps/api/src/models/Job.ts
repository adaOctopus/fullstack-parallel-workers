import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { Job as JobType, JobResult } from "@emma/shared";

// MongoDB schema with type-safe Document interface
export interface JobDocument extends Omit<JobType, "id">, Document {
  _id: mongoose.Types.ObjectId;
}

const JobResultSchema = new Schema<JobResult>({
  operation: {
    type: String,
    enum: ["add", "subtract", "multiply", "divide"],
    required: true,
  },
  result: { type: Number, default: null },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  },
  error: { type: String, optional: true },
});

const JobSchema = new Schema<JobDocument>(
  {
    numberA: { type: Number, required: true },
    numberB: { type: Number, required: true },
    results: { type: [JobResultSchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const Job: Model<JobDocument> =
  mongoose.models.Job || mongoose.model<JobDocument>("Job", JobSchema);
