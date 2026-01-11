import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PostHogProvider } from "posthog-js/react";
import App from "./App.tsx";
import "./index.css";

const posthogKey =
  (import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined) ??
  (import.meta.env.VITE_POSTHOG_KEY as string | undefined);
const posthogHost =
  (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) ??
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined);

const posthogOptions = {
  api_host: posthogHost,
  capture_pageview: false,
  defaults: "2025-11-30",
} as const;

const app = posthogKey ? (
  <PostHogProvider apiKey={posthogKey} options={posthogOptions}>
    <App />
  </PostHogProvider>
) : (
  <App />
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>{app}</StrictMode>
);
