import { supabaseServer } from "@/app/lib/supabase/server";
import type {
  GoalMapInsert,
  GoalMapRow,
  GoalStepRow,
  GoalTodayActionOrigin,
  GoalTodayActionRow,
  GoalTodayActionStatus,
} from "./types";

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

export async function listGoalStepsForMap(goalMapId: string): Promise<GoalStepRow[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("goal_steps")
    .select("*")
    .eq("goal_map_id", goalMapId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as GoalStepRow[];
}

export async function getGoalStepByIdAndMap(params: {
  stepId: string;
  goalMapId: string;
}): Promise<GoalStepRow | null> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("goal_steps")
    .select("*")
    .eq("id", params.stepId)
    .eq("goal_map_id", params.goalMapId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as GoalStepRow | null;
}

export async function replaceGoalSteps(
  goalMapId: string,
  steps: readonly { step_kind: "fixed" | "variable"; title: string; sort_order: number }[]
) {
  const sb = await supabaseServer();
  const del = await sb.from("goal_steps").delete().eq("goal_map_id", goalMapId);
  if (del.error) throw new Error(del.error.message);
  if (steps.length === 0) return;
  const rows = steps.map((s, idx) => ({
    goal_map_id: goalMapId,
    step_kind: s.step_kind,
    title: String(s.title ?? "").trim(),
    sort_order: Number.isFinite(s.sort_order) ? s.sort_order : idx,
  }));
  const ins = await sb.from("goal_steps").insert(rows);
  if (ins.error) throw new Error(ins.error.message);
}

export async function listGoalTodayActions(params: {
  userId: string;
  goalMapId: string;
  dayKey: string;
}): Promise<GoalTodayActionRow[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("goal_today_actions")
    .select("*")
    .eq("user_id", params.userId)
    .eq("goal_map_id", params.goalMapId)
    .eq("day_key", params.dayKey)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as GoalTodayActionRow[];
}

export async function insertGoalTodayAction(params: {
  userId: string;
  goalMapId: string;
  dayKey: string;
  title: string;
  origin: GoalTodayActionOrigin;
  linkedStepId?: string | null;
}): Promise<GoalTodayActionRow> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("goal_today_actions")
    .insert({
      user_id: params.userId,
      goal_map_id: params.goalMapId,
      day_key: params.dayKey,
      title: params.title.trim(),
      origin: params.origin,
      linked_step_id: params.linkedStepId ?? null,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as GoalTodayActionRow;
}

export async function getGoalTodayActionForUser(params: {
  actionId: string;
  userId: string;
}): Promise<GoalTodayActionRow | null> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("goal_today_actions")
    .select("*")
    .eq("id", params.actionId)
    .eq("user_id", params.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as GoalTodayActionRow | null;
}

export async function patchGoalTodayAction(params: {
  actionId: string;
  userId: string;
  patch: Partial<{
    title: string;
    status: GoalTodayActionStatus;
    completed_at: string | null;
    completion_note: string | null;
  }>;
}): Promise<GoalTodayActionRow> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("goal_today_actions")
    .update(params.patch)
    .eq("id", params.actionId)
    .eq("user_id", params.userId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as GoalTodayActionRow;
}

export async function insertGoalTodayActionAward(params: {
  actionId: string;
  userId: string;
}): Promise<boolean> {
  const sb = await supabaseServer();
  const { error } = await sb.from("goal_today_action_point_awards").insert({
    today_action_id: params.actionId,
    user_id: params.userId,
  });
  if (!error) return true;
  const code = (error as { code?: string }).code;
  if (code === "23505") return false;
  throw new Error(error.message);
}

