export type EnvCheck = {
  hasSupabaseUrl: boolean;
  hasSupabaseAnonKey: boolean;
};

function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v : undefined;
}

export function getSupabasePublicEnv(): {
  url?: string;
  anonKey?: string;
  check: EnvCheck;
} {
  const url = read("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return {
    url,
    anonKey,
    check: { hasSupabaseUrl: Boolean(url), hasSupabaseAnonKey: Boolean(anonKey) },
  };
}

