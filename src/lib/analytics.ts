import posthog from "posthog-js";

const POSTHOG_ENABLED = false;

const POSTHOG_KEY =
  (import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined) ??
  (import.meta.env.VITE_POSTHOG_KEY as string | undefined);
const POSTHOG_HOST =
  (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) ??
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
  "https://app.posthog.com";

let initialized = false;

function isPosthogLoaded(): boolean {
  return Boolean((posthog as { __loaded?: boolean }).__loaded);
}

/**
 * Initialize PostHog analytics
 * Call this once at app startup
 */
export function initPosthog(): void {
  if (!POSTHOG_ENABLED) return;
  if (initialized || !POSTHOG_KEY) {
    if (!POSTHOG_KEY) {
      console.warn("[Analytics] PostHog key not configured. Analytics disabled.");
    }
    return;
  }

  if (isPosthogLoaded()) {
    initialized = true;
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // We'll handle this manually
    persistence: "localStorage",
    autocapture: false,
  });

  initialized = true;
}

/**
 * Identify the current user
 */
export function identify(
  userId: string,
  properties?: { email?: string; workspace_id?: string; workspace_name?: string }
): void {
  if (!POSTHOG_ENABLED) return;
  if (!initialized && !isPosthogLoaded()) return;
  posthog.identify(userId, properties);
}

/**
 * Track a custom event
 */
export function track(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>
): void {
  if (!POSTHOG_ENABLED) return;
  if (!initialized && !isPosthogLoaded()) {
    console.debug(`[Analytics] Would track: ${event}`, properties);
    return;
  }
  posthog.capture(event, properties);
}

/**
 * Track a page view
 */
export function trackPageview(path: string): void {
  if (!POSTHOG_ENABLED) return;
  if (!initialized && !isPosthogLoaded()) return;
  posthog.capture("$pageview", { $current_url: path });
}

/**
 * Reset analytics (on logout)
 */
export function resetAnalytics(): void {
  if (!POSTHOG_ENABLED) return;
  if (!initialized && !isPosthogLoaded()) return;
  posthog.reset();
}

// Pre-defined event names for consistency
export const AnalyticsEvents = {
  AUTH_LOGIN_SUCCESS: "auth_login_success",
  AUTH_SIGNUP_SUCCESS: "auth_signup_success",
  AUTH_LOGOUT: "auth_logout",
  ONBOARDING_COMPLETED: "onboarding_completed",
  PAYWALL_OPENED: "paywall_opened",
  CHECKOUT_STARTED: "checkout_started",
  BILLING_PAID: "billing_paid",
  MODULE_OPENED: "module_opened",
  SIMULATOR_RUN: "simulator_run",
  LANDING_CTA_CLICK: "landing_cta_click",
  LANDING_SECTION_VIEW: "landing_section_view",
} as const;
