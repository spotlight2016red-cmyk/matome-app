import { supabaseServer } from "@/app/lib/supabase/server";
import type { GoalMapInsert, GoalMapRow } from "./types";

export async function listGoalMaps(params: { userId: string; limit?: number }) {
  const limit = params?.limit ?? 10;
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("goal_maps")
    .select("*")
    .eq("user_id", params.userId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as GoalMapRow[];
}

export async function getGoalMapByIdForUser(params: { id: string; userId: string }) {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("goal_maps")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", params.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as GoalMapRow | null;
}

export async function upsertGoalMap(input: GoalMapInsert & { id?: string }) {
  const sb = await supabaseServer();
  const payload: any = { ...input };
  const { data, error } = await sb
    .from("goal_maps")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single<GoalMapRow>();
  if (error) throw new Error(error.message);
  return data;
}

