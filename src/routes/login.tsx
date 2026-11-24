import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { oauthReturnPath } from "@/lib/oauth-return-path";
import { LangToggle, useLang } from "@/lib/i18n";

const NEXT_KEY = "auth_next";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ next: oauthReturnPath(s["next"]) }),
  head: () => ({
    meta: [
      { title: "Sign in — Peticiona" },
      { name: "description", content: "Sign in to Peticiona." },
      { property: "og:title", content: "Sign in — Peticiona" },
      { property: "og:description", content: "Sign in to Peticiona." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const { t } = useLang();
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
        setMsg(t("checkEmail"));
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMsg(t("resetSent"));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  if (signedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-card-foreground">
          <div className="flex items-start justify-between">
            <h1 className="text-xl font-semibold">{t("youreSignedIn")}</h1>
            <LangToggle />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{t("signedInAs", { email: signedIn })}</p>
          <div className="mt-6 flex gap-2">
            <Button onClick={() => window.location.assign("/demo.html")}>{t("openDemo")}</Button>
            <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); setSignedIn(null); }}>{t("signOut")}</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-card-foreground">
        <div className="flex items-start justify-between">
          <h1 className="text-xl font-semibold">
            {mode === "signup" ? t("createAccount") : mode === "forgot" ? t("resetPassword") : t("signIn")}
          </h1>
          <LangToggle />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Peticiona</p>
        <form onSubmit={submit} className="mt-6 grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "forgot" && (
            <div className="grid gap-1.5">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          <Button type="submit" disabled={busy}>
            {mode === "signup" ? t("signUp") : mode === "forgot" ? t("sendResetLink") : t("signIn")}
          </Button>
        </form>
        <div className="mt-4 flex flex-col gap-1 text-sm">
          {mode === "signin" && <>
            <button className="text-left text-primary underline-offset-4 hover:underline" onClick={() => setMode("signup")}>{t("noAccount")}</button>
            <button className="text-left text-muted-foreground underline-offset-4 hover:underline" onClick={() => setMode("forgot")}>{t("forgotPassword")}</button>
          </>}
          {mode !== "signin" && <button className="text-left text-primary underline-offset-4 hover:underline" onClick={() => setMode("signin")}>{t("backToSignIn")}</button>}
        </div>
      </div>
    </main>
  );
}
