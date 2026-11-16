// Shared Claude call through Lovable AI, used by the demo page's address and the MCP tool.
export const DEMO_MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"] as const;
export type DemoModel = (typeof DEMO_MODELS)[number];
export const MAX_PROMPT_CHARS = 20000;

// The demo's model names mapped to the closest Claude models served by Lovable AI.
const MODEL_MAP: Record<DemoModel, string> = {
  "claude-haiku-5-5": "anthropic/claude-haiku-4-5",
  "claude-sonnet-5-5": "anthropic/claude-sonnet-5",
  "claude-opus-5-5": "anthropic/claude-opus-5-5",
};

export class ClaudeError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function askClaude(prompt: string, model: DemoModel, signal?: AbortSignal) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new ClaudeError("AI is not configured", 500);
  const r = await fetch("https://ai.gateway.lovable.dev/v1/messages", {
    method: "POST",
    signal: signal ?? null,
    headers: { Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL_MAP[model], max_tokens: 2500, stream: true, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok || !r.body) {
    const err = await r.json().catch(() => null);
    const status = [402, 403, 429].includes(r.status) ? r.status : 502;
    throw new ClaudeError(err?.error?.message || err?.message || "AI request failed", status);
  }
  // Read the stream server-side and return the full answer.
  let text = "", usedModel: string = model, buf = "", stop = "";
  const usage: Record<string, unknown> = {};
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      let ev: any;
      try { ev = JSON.parse(line.slice(5).trim()); } catch { continue; }
      if (ev.type === "message_start") { usedModel = ev.message?.model || usedModel; Object.assign(usage, ev.message?.usage || {}); }
      else if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") text += ev.delta.text;
      else if (ev.type === "message_delta") { Object.assign(usage, ev.usage || {}); stop = ev.delta?.stop_reason || stop; }
      else if (ev.type === "error") throw new ClaudeError(ev.error?.message || "AI error", 502);
    }
  }
  if (stop === "refusal") throw new ClaudeError("The model declined this request.", 400);
  return { text, model: usedModel, usage };
}
