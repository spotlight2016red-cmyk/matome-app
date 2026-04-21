import { supabaseServer } from "@/app/lib/supabase/server";

export async function POST() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  return Response.json({ ok: true });
}

