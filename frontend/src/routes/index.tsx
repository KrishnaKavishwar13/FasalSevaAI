import { createFileRoute } from "@tanstack/react-router";
import { App } from "@/App";

export const Route = createFileRoute("/")({
  component: App,
  head: () => ({
    meta: [
      { title: "FasalSeva AI — Post-Harvest Decision Intelligence for Indian Farmers" },
      {
        name: "description",
        content:
          "AI-powered shelf-life prediction, mandi price forecasting, and cold storage discovery — one recommendation that maximizes your profit.",
      },
      { property: "og:title", content: "FasalSeva AI" },
      {
        property: "og:description",
        content: "Sell, wait, or store — an AI decision engine for post-harvest India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
