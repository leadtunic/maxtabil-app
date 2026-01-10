import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

// Allow app to load without Supabase for development/preview
const isMissingConfig = !supabaseUrl || !supabaseAnonKey;

if (isMissingConfig) {
  console.warn(
    "[Supabase] Missing environment variables. App will run in demo mode. " +
    "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for full functionality."
  );
}

// Using placeholder values if not configured - will show errors when trying to use Supabase
const url = supabaseUrl || "https://placeholder.supabase.co";
const key = supabaseAnonKey || "placeholder-key";

// Using untyped client for flexibility - types are defined in src/types/supabase.ts
export const supabase: SupabaseClient = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = !isMissingConfig;

/**
 * Increment the click counter for a link
 */
export async function trackLinkClick(linkId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("increment_link_clicks", {
      link_id: linkId,
    });
    
    if (error) {
      console.error("Error tracking link click:", error);
    }
  } catch (err) {
    console.error("Error tracking link click:", err);
  }
}
