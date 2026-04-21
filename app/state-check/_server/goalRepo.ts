import { supabaseAdmin } from "@/app/lib/supabase/admin";
import type { GoalMapInsert, GoalMapRow } from "./types";

export async function listGoalMaps(params?: { limit?: number }) {
  const limit = params?.limit ?? 10;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("goal_maps")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as GoalMapRow[];
}

export async function upsertGoalMap(input: GoalMapInsert & { id?: string }) {
  const sb = supabaseAdmin();
  const payload: any = { ...input };
  const { data, error } = await sb
    .from("goal_maps")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single<GoalMapRow>();
  if (error) throw new Error(error.message);
  return data;
}

