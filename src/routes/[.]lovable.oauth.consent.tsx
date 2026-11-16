import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type OAuthResult = { data: any; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // SSR has no localStorage session and would redirect signed-in users.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connect an app — AI Demo Gateway" },
      { name: "description", content: "Approve or deny an app's access to AI Demo Gateway." },
      { property: "og:title", content: "Connect an app — AI Demo Gateway" },
      { property: "og:description", content: "Approve or deny an app's access to AI Demo Gateway." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("This link is missing its authorization request.");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/login", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    const { data: u } = await supabase.auth.getUser();
    return { details: data, email: u.user?.email ?? "" };
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground">
        <h1 className="text-lg font-semibold">This request can't be completed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : String(error)} It may have expired — start the connection again from your app.
        </p>
      </div>
    </main>
  ),
});

function scopeLabel(s: string) {
  if (s === "openid") return null;
  if (s === "email") return "Share your email address";
  if (s === "profile") return "Share your basic profile";
  return `Additional permission requested: ${s}`;
}

function Consent() {
  const { details, email } = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = details?.client?.name ?? "An app";
  const redirectUri: string = details?.redirect_uri ?? details?.client?.redirect_uri ?? "";
  const scopes = String(details?.scope ?? "openid email profile").split(/\s+/).map(scopeLabel).filter(Boolean);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("No redirect was returned. Please try again."); return; }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground">
        <h1 className="text-xl font-semibold">Connect {client} to AI Demo Gateway</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {client} will be able to send prompts to the demo's Claude models as you{email ? ` (${email})` : ""}.
        </p>
        {redirectUri && <p className="mt-3 break-all text-xs text-muted-foreground">Returns to: {redirectUri}</p>}
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
          {scopes.map((s) => <li key={s}>{s}</li>)}
          <li>Use the "Ask Claude" tool</li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">This does not bypass this app's permissions.</p>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex gap-2">
          <Button disabled={busy} onClick={() => decide(true)}>Approve</Button>
          <Button variant="outline" disabled={busy} onClick={() => decide(false)}>Cancel connection</Button>
        </div>
      </div>
    </main>
  );
}
