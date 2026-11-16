import { createFileRoute } from "@tanstack/react-router";
import { askClaude, ClaudeError, DEMO_MODELS, MAX_PROMPT_CHARS, type DemoModel } from "@/lib/claude-gateway";

// Same behavior as the uploaded "llm" function, served from the app for the demo page.
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
        if (!model || !(DEMO_MODELS as readonly string[]).includes(model)) return json({ error: "Model not allowed" }, 400);
        try {
          return json(await askClaude(prompt, model as DemoModel));
        } catch (e) {
          if (e instanceof ClaudeError) return json({ error: e.message }, e.status);
          return json({ error: "AI request failed" }, 502);
        }
      },
    },
  },
});
