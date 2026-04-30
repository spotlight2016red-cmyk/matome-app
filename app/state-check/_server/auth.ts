import { supabaseServer } from "@/app/lib/supabase/server";

export async function requireUserId() {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getUser();
  if (error) return null;
  const user = data.user;
  if (!user?.id) return null;
  if (!user.email_confirmed_at) return null;
  return user.id;
}

