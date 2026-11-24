import { auth, defineMcp } from "@lovable.dev/mcp-js";
import askClaudeTool from "./tools/ask-claude";

// Vite inlines the stable ref; the published SUPABASE_URL may be a proxy.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "peticiona",
  title: "Peticiona",
  version: "0.1.0",
  instructions: "Tools for Peticiona. Use `ask_claude` to send a prompt to the demo's Claude models.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [askClaudeTool],
});
