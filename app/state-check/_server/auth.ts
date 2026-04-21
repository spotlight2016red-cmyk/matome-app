import { supabaseServer } from "@/app/lib/supabase/server";

export async function requireUserId() {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getUser();
  if (error) return null;
  const id = data.user?.id ?? null;
  return id;
}

