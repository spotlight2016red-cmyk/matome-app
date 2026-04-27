import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/app/lib/env";

export function supabaseBrowser() {
  const { url, anonKey, check } = getSupabasePublicEnv();
  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  // If Vercel env is set but the client still misses it, the build was made without it.
  if (!check.hasSupabaseUrl || !check.hasSupabaseAnonKey) {
    // keep errors above for exact missing key
  }
  return createBrowserClient(url, anonKey);
}

