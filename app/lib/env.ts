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
  // Supabase is migrating from legacy anon key to publishable key.
  // Support both to avoid "env set mismatch" between deployments.
  const rawAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const url = rawUrl && rawUrl.trim() ? rawUrl : undefined;
  const anonKey = rawAnonKey && rawAnonKey.trim() ? rawAnonKey : undefined;
  return {
    url,
    anonKey,
    check: { hasSupabaseUrl: Boolean(url), hasSupabaseAnonKey: Boolean(anonKey) },
  };
}

