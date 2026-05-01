import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/app/lib/env";

export async function supabaseServer() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicEnv();
  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) {
    throw new Error(
      "Missing Supabase anon/publishable key (NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // App Router の Route Handler 等で Cookie 書き込みが拒否されることがある。
          // 既存 Cookie の読み取りだけで十分なケースが多いので握りつぶす。
        }
      },
    },
  });
}

