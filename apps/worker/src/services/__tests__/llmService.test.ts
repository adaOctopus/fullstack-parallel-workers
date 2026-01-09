import { llmService } from "../llmService";
import OpenAI from "openai";

// Mock OpenAI
jest.mock("openai");

describe("LLMService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should compute addition using LLM", async () => {
    const mockCompletion = {
      choices: [
        {
          message: {
            content: "15",
          },
        },
      ],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 10,
      },
    };

    (OpenAI as any).mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockCompletion),
        },
      },
    }));

    const result = await llmService.compute("add", 10, 5);

    expect(result.result).toBe(15);
    expect(result.tokensUsed).toBe(60);
    expect(result.cost).toBeGreaterThan(0);
  });

  it("should track token usage and cost", async () => {
    const mockCompletion = {
      choices: [
        {
          message: {
            content: "50",
          },
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 20,
      },
    };

    (OpenAI as any).mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockCompletion),
        },
      },
    }));

    const result = await llmService.compute("multiply", 10, 5);

    expect(result.tokensUsed).toBe(120);
    expect(result.cost).toBeCloseTo((120 / 1000) * 0.002, 5);
  });
});
