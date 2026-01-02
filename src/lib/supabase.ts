import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Increment the click counter for a link
 */
export async function trackLinkClick(linkId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_link_clicks', {
      link_id: linkId
    });
    
    if (error) {
      console.error('Error tracking link click:', error);
    }
  } catch (error) {
    console.error('Error tracking link click:', error);
  }
}
