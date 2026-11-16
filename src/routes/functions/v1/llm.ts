import { createFileRoute } from "@tanstack/react-router";

// Same behavior as the uploaded "llm" function: proxies the demo's model calls to Anthropic.
const ALLOWED = ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"];
// The demo's model names mapped to the closest Claude models served by Lovable AI.
const MODEL_MAP: Record<string, string> = {
  "claude-haiku-5-5": "anthropic/claude-haiku-4-5",
  "claude-sonnet-5-5": "anthropic/claude-sonnet-5",
  "claude-opus-5-5": "anthropic/claude-opus-5-5",
};
const MAX_PROMPT_CHARS = 20000;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

export const Route = createFileRoute("/functions/v1/llm")({
  server: {
    handlers: {
      OPTIONS: async () => new Response("ok", { headers: cors }),
      GET: async () => json({ error: "POST only" }, 405),
      POST: async ({ request }) => {
        let body: { prompt?: string; model?: string };
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
        const { prompt, model } = body;
        if (typeof prompt !== "string" || !prompt || prompt.length > MAX_PROMPT_CHARS) return json({ error: "Invalid prompt" }, 400);
        if (!model || !ALLOWED.includes(model)) return json({ error: "Model not allowed" }, 400);
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return json({ error: "AI is not configured" }, 500);
        const r = await fetch("https://ai.gateway.lovable.dev/v1/messages", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch", "content-type": "application/json" },
          body: JSON.stringify({ model: MODEL_MAP[model], max_tokens: 2500, stream: true, messages: [{ role: "user", content: prompt }] }),
        });
        if (!r.ok || !r.body) {
          const err = await r.json().catch(() => null);
          const status = [402, 403, 429].includes(r.status) ? r.status : 502;
          return json({ error: err?.error?.message || err?.message || "AI request failed" }, status);
        }
        // Read the stream server-side and return the full answer in the original shape.
        let text = "", usedModel = model, buf = "", stop = "";
        const usage: Record<string, number> = {};
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
            else if (ev.type === "error") return json({ error: ev.error?.message || "AI error" }, 502);
          }
        }
        if (stop === "refusal") return json({ error: "The model declined this request." }, 400);
        return json({ text, model: usedModel, usage });
      },
    },
  },
});
