import { createFileRoute } from "@tanstack/react-router";

// Same behavior as the uploaded "llm" function: proxies the demo's model calls to Anthropic.
const ALLOWED = ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"];
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
        const key = process.env.ANTHROPIC_API_KEY;
        if (!key) return json({ error: "Missing ANTHROPIC_API_KEY" }, 500);
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
          body: JSON.stringify({ model, max_tokens: 2500, messages: [{ role: "user", content: prompt }] }),
        });
        const data = await r.json();
        if (!r.ok) return json({ error: data?.error?.message || "Anthropic API error" }, r.status === 429 ? 429 : 502);
        const text = (data.content || []).map((c: { text?: string }) => c.text || "").join("");
        return json({ text, model: data.model, usage: data.usage });
      },
    },
  },
});
