import { supabaseServer } from "@/app/lib/supabase/server";

export async function getMyPoints(): Promise<number> {
  const sb = await supabaseServer();
  const { data, error } = await sb.from("user_points").select("points").single();
  // If row doesn't exist yet, treat as 0.
  if (error) return 0;
  const p = Number((data as any)?.points ?? 0);
  return Number.isFinite(p) ? p : 0;
}

export async function incrementMyPoints(delta: number): Promise<number> {
  const sb = await supabaseServer();
  const d = Math.max(0, Math.floor(Number(delta ?? 0)));
  const { data, error } = await sb.rpc("increment_my_points", { delta: d });
  if (error) throw new Error(error.message);
  const p = Number(data ?? 0);
  return Number.isFinite(p) ? p : 0;
}

