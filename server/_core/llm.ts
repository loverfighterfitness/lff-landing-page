/**
 * LLM helper — Manus Forge service (removed).
 * This module is unused. Stub retained for type safety.
 */
export type Role = "system" | "user" | "assistant";
export type Message = { role: Role; content: string };

export async function chatCompletion(_messages: Message[]): Promise<string> {
  throw new Error("LLM service not available — Manus Forge removed");
}
