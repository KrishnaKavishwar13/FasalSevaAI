import { createFileRoute } from "@tanstack/react-router";
import { App } from "@/App";

// Splat: every non-file URL is handled by the React Router app inside <App />.
export const Route = createFileRoute("/$")({
  component: App,
});
