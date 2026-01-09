import mongoose, { Schema, type Document, type Model } from "mongoose";

// Reuse the same Job model structure
export interface JobDocument extends Document {
  numberA: number;
  numberB: number;
  results: Array<{
    operation: string;
    result: number | null;
    status: string;
    error?: string;
  }>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobResultSchema = new Schema({
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
