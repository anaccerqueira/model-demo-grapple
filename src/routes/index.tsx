import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/demo.html" });
  },
  head: () => ({
    meta: [
      { title: "Demo" },
      { name: "description", content: "Interactive model demo." },
      { property: "og:title", content: "Demo" },
      { property: "og:description", content: "Interactive model demo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
