export type EnvCheck = {
  hasSupabaseUrl: boolean;
  hasSupabaseAnonKey: boolean;
};

export function getSupabasePublicEnv(): {
  url?: string;
  anonKey?: string;
  check: EnvCheck;
} {
  // IMPORTANT:
  // - For client components, Next.js only inlines NEXT_PUBLIC_* when referenced statically.
  // - Avoid process.env[name] dynamic access here, otherwise the client bundle won't get env.
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = rawUrl && rawUrl.trim() ? rawUrl : undefined;
  const anonKey = rawAnonKey && rawAnonKey.trim() ? rawAnonKey : undefined;
  return {
    url,
    anonKey,
    check: { hasSupabaseUrl: Boolean(url), hasSupabaseAnonKey: Boolean(anonKey) },
  };
}

