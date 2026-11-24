import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LangToggle, useLang } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — Peticiona" },
      { name: "description", content: "Choose a new password for your Peticiona account." },
      { property: "og:title", content: "Set a new password — Peticiona" },
      { property: "og:description", content: "Choose a new password for your Peticiona account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setErr(error.message);
    else setMsg(t("passwordUpdated"));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <form onSubmit={submit} className="grid w-full max-w-sm gap-3 rounded-lg border border-border bg-card p-6 text-card-foreground">
        <div className="flex items-start justify-between">
          <h1 className="text-xl font-semibold">{t("setNewPassword")}</h1>
          <LangToggle />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="pw">{t("newPassword")}</Label>
          <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        <Button type="submit" disabled={busy}>{t("savePassword")}</Button>
      </form>
    </main>
  );
}
