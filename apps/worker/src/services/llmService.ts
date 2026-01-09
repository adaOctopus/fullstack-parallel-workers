import OpenAI from "openai";
import type { OperationType } from "@emma/shared";

// LLM service with type-safe operation handling
export interface LLMComputeResult {
  result: number;
  tokensUsed: number;
  cost: number;
}

// Conditional Types for operation-specific prompts
type OperationPrompt<T extends OperationType> = T extends "add"
  ? "addition"
  : T extends "subtract"
  ? "subtraction"
  : T extends "multiply"
  ? "multiplication"
  : T extends "divide"
  ? "division"
  : never;

class LLMService {
  private client: OpenAI;
  private readonly PRICE_PER_1K_TOKENS = 0.002; // Approximate cost for GPT-3.5-turbo

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    this.client = new OpenAI({ apiKey });
  }

  // Generic with Constraints: Type-safe operation computation
  async compute<T extends OperationType>(
    operation: T,
    a: number,
    b: number
  ): Promise<LLMComputeResult> {
    const operationNames: Record<OperationType, string> = {
      add: "addition",
      subtract: "subtraction",
      multiply: "multiplication",
      divide: "division",
    };

    const symbols: Record<OperationType, string> = {
      add: "+",
      subtract: "-",
      multiply: "*",
      divide: "/",
    };

    const prompt = `Compute the ${operationNames[operation]} of ${a} ${symbols[operation]} ${b}. 
Return ONLY the numerical result, no explanation, no text, just the number.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a precise mathematical calculator. Return only numerical results.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0,
        max_tokens: 50,
      });

      const resultText = completion.choices[0]?.message?.content?.trim() || "";
      const result = parseFloat(resultText);

      if (isNaN(result)) {
        throw new Error(`Invalid result from LLM: ${resultText}`);
      }

      const tokensUsed =
        (completion.usage?.prompt_tokens || 0) +
        (completion.usage?.completion_tokens || 0);
      const cost = (tokensUsed / 1000) * this.PRICE_PER_1K_TOKENS;

      return {
        result,
        tokensUsed,
        cost,
      };
    } catch (error) {
      console.error(`LLM computation error for ${operation}:`, error);
      throw error;
    }
  }
}

export const llmService = new LLMService();
