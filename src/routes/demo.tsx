import { createFileRoute, redirect } from "@tanstack/react-router";

// "/demo" is a short link to the signed-in demo page.
export const Route = createFileRoute("/demo")({
  beforeLoad: () => {
    throw redirect({ href: "/demo.html" });
  },
  head: () => ({
    meta: [
      { title: "Peticiona demo" },
      { name: "description", content: "Short link to the Peticiona AI case workflow demo." },
      { property: "og:title", content: "Peticiona demo" },
      { property: "og:description", content: "Short link to the Peticiona AI case workflow demo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
