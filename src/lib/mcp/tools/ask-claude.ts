import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { askClaude, ClaudeError, DEMO_MODELS, MAX_PROMPT_CHARS } from "../../claude-gateway";

export default defineTool({
  name: "ask_claude",
  title: "Ask Claude",
  description: "Send a prompt to one of the demo's Claude models (haiku, sonnet or opus) and return its answer.",
  inputSchema: {
    prompt: z.string().min(1).max(MAX_PROMPT_CHARS).describe("The prompt to send."),
    model: z.enum(DEMO_MODELS).default("claude-sonnet-5-5").describe("Which demo model to use."),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ prompt, model }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    try {
      const r = await askClaude(prompt, model, ctx.signal);
      return { content: [{ type: "text", text: r.text }], structuredContent: { text: r.text, model: r.model } };
    } catch (e) {
      throw new ToolError(e instanceof ClaudeError ? e.message : "AI request failed");
    }
  },
});
