import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { oauthReturnPath } from "@/lib/oauth-return-path";

const NEXT_KEY = "auth_next";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ next: oauthReturnPath(s["next"]) }),
  head: () => ({
    meta: [
      { title: "Sign in — AI Demo Gateway" },
      { name: "description", content: "Sign in to connect assistants to AI Demo Gateway." },
      { property: "og:title", content: "Sign in — AI Demo Gateway" },
      { property: "og:description", content: "Sign in to connect assistants to AI Demo Gateway." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState<string | null>(null);

  const goNext = (path: string) => {
    if (path.startsWith("/.lovable/") || path.endsWith(".html")) window.location.assign(path);
    else navigate({ to: path });
  };

  useEffect(() => {
    // After a social sign-in returns here, continue to the saved destination.
    const saved = oauthReturnPath(sessionStorage.getItem(NEXT_KEY));
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const target = next !== "/" ? next : saved;
      sessionStorage.removeItem(NEXT_KEY);
      if (target !== "/") goNext(target);
      else setSignedIn(data.user.email ?? "your account");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        goNext(next);
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: new URL(next, window.location.origin).href },
        });
        if (error) throw error;
        setMsg("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMsg("If that email has an account, a reset link is on its way.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (signedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-card-foreground">
          <h1 className="text-xl font-semibold">You're signed in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Signed in as {signedIn}.</p>
          <div className="mt-6 flex gap-2">
            <Button onClick={() => window.location.assign("/demo.html")}>Open demo</Button>
            <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); setSignedIn(null); }}>Sign out</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-card-foreground">
        <h1 className="text-xl font-semibold">
          {mode === "signup" ? "Create an account" : mode === "forgot" ? "Reset your password" : "Sign in"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">AI Demo Gateway</p>
        <form onSubmit={submit} className="mt-6 grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "forgot" && (
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          <Button type="submit" disabled={busy}>
            {mode === "signup" ? "Sign up" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 flex flex-col gap-1 text-sm">
          {mode === "signin" && <>
            <button className="text-left text-primary underline-offset-4 hover:underline" onClick={() => setMode("signup")}>No account? Sign up</button>
            <button className="text-left text-muted-foreground underline-offset-4 hover:underline" onClick={() => setMode("forgot")}>Forgot password?</button>
          </>}
          {mode !== "signin" && <button className="text-left text-primary underline-offset-4 hover:underline" onClick={() => setMode("signin")}>Back to sign in</button>}
        </div>
      </div>
    </main>
  );
}
