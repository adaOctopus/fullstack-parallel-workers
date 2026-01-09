import { Router, type Request, type Response } from "express";
import { jobService } from "../services/jobService";
import { validateComputeRequest, createSuccessResponse, createErrorResponse } from "@emma/shared";
import type { SafeApiResponse } from "@emma/shared";

const router = Router();

// Type-Safe Boundaries: Validate unknown request body
router.post("/", async (req: Request, res: Response<SafeApiResponse<{ id: string }>>) => {
  try {
    // Validate input at API boundary
    const validated = validateComputeRequest(req.body);
    
    const job = await jobService.createJob(validated.numberA, validated.numberB);
    
    // Cache job
    await jobService.cacheJob(job._id.toString(), job);
    
    res.status(201).json(createSuccessResponse({ id: job._id.toString() }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json(createErrorResponse(message, 400));
  }
});

router.get("/:id", async (req: Request, res: Response<SafeApiResponse<any>>) => {
  try {
    const { id } = req.params;
    
    // Try cache first
    const cached = await jobService.getCachedJob(id);
    if (cached) {
      return res.json(createSuccessResponse(cached));
    }
    
    const job = await jobService.getJobById(id);
    if (!job) {
      return res.status(404).json(createErrorResponse("Job not found", 404));
    }
    
    res.json(createSuccessResponse(job));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json(createErrorResponse(message, 500));
  }
});

export default router;
