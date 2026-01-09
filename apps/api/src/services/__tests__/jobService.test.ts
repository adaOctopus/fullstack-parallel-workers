import { jobService } from "../jobService";
import { Job } from "../../models/Job";
import mongoose from "mongoose";

// Mock mongoose
jest.mock("../../models/Job");

describe("JobService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a job with correct structure", async () => {
    const mockJob = {
      _id: new mongoose.Types.ObjectId(),
      numberA: 10,
      numberB: 5,
      results: [
        { operation: "add", status: "pending" },
        { operation: "subtract", status: "pending" },
        { operation: "multiply", status: "pending" },
        { operation: "divide", status: "pending" },
      ],
      status: "pending",
      save: jest.fn().mockResolvedValue(true),
    };

    (Job as any).mockImplementation(() => mockJob);

    const job = await jobService.createJob(10, 5);

    expect(job.numberA).toBe(10);
    expect(job.numberB).toBe(5);
    expect(job.results).toHaveLength(4);
    expect(mockJob.save).toHaveBeenCalled();
  });

  it("should get job by id", async () => {
    const mockJob = {
      _id: "123",
      numberA: 10,
      numberB: 5,
    };

    (Job.findById as jest.Mock).mockResolvedValue(mockJob);

    const job = await jobService.getJobById("123");

    expect(job).toEqual(mockJob);
    expect(Job.findById).toHaveBeenCalledWith("123");
  });
});
