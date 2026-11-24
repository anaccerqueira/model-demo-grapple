import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LangToggle, useLang } from "@/lib/i18n";
import demoHtml from "@/assets/demo.html?raw";

// The demo page is shown only to signed-in users; its model calls carry the user's session.
const BRIDGE = `<script>(function(){var f=window.fetch.bind(window);window.fetch=async function(u,o){o=o||{};if(String(u).indexOf("/functions/v1/llm")!==-1){var t=await parent.__demoToken();var h=new Headers(o.headers||{});h.set("Authorization","Bearer "+t);o=Object.assign({},o,{headers:h});}return f(u,o);};})();</script>`;

declare global {
  interface Window { __demoToken?: () => Promise<string> }
}

export const Route = createFileRoute("/demo.html")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", search: { next: "/demo.html" } });
    return { email: data.user.email ?? "" };
  },
  head: () => ({
    meta: [
      { title: "Grapple BR · AI case workflow demo" },
      { name: "description", content: "Interactive AI case workflow demo for signed-in users." },
      { property: "og:title", content: "Grapple BR · AI case workflow demo" },
      { property: "og:description", content: "Interactive AI case workflow demo for signed-in users." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Demo,
});

function Demo() {
  const { t } = useLang();
  const { email } = Route.useRouteContext();
  const [out, setOut] = useState(false);
  const srcDoc = useMemo(() => demoHtml.replace(/<head>/i, "<head>" + BRIDGE), []);

  useEffect(() => {
    window.__demoToken = async () => (await supabase.auth.getSession()).data.session?.access_token ?? "";
    const { data } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_OUT") window.location.assign("/login?next=/demo.html");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    setOut(true);
    await supabase.auth.signOut();
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-1.5 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Peticiona</span>
        <div className="flex items-center gap-3">
          <LangToggle />
          <span>{email}</span>
          <button onClick={signOut} disabled={out} className="text-primary underline-offset-4 hover:underline">{t("signOut")}</button>
        </div>
      </div>
      <iframe title="Demo" srcDoc={srcDoc} className="w-full flex-1 border-0" />
    </div>
  );
}
