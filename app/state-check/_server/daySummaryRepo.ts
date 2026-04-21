import { supabaseServer } from "@/app/lib/supabase/server";
import type { DaySummaryInsert, DaySummaryRow } from "./types";

export async function upsertDaySummary(input: DaySummaryInsert) {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("day_summaries")
    .upsert(
      {
        user_id: input.user_id,
        day_key: input.day_key,
        drift_text: input.drift_text ?? null,
        recovered_text: input.recovered_text ?? null,
        tomorrow_step_text: input.tomorrow_step_text ?? null,
      },
      { onConflict: "user_id,day_key" }
    )
    .select("*")
    .single<DaySummaryRow>();
  if (error) throw new Error(error.message);
  return data;
}

export async function listDaySummaries(params?: { limit?: number }) {
  const limit = params?.limit ?? 30;
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("day_summaries")
    .select("*")
    .order("day_key", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as DaySummaryRow[];
}

