import { supabaseServer } from "@/app/lib/supabase/server";
import type { DiagnosisRunInsert, DiagnosisRunRow } from "./types";

export async function createDiagnosisRun(input: DiagnosisRunInsert) {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("diagnosis_runs")
    .insert(input)
    .select("*")
    .single<DiagnosisRunRow>();
  if (error) throw new Error(error.message);
  return data;
}

export async function listDiagnosisRuns(params?: { limit?: number }) {
  const limit = params?.limit ?? 30;
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("diagnosis_runs")
    .select("id, created_at, result_type, note_text, propulsion_score, fatigue_score, confusion_score, recovery_score, heat_score")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as DiagnosisRunRow[];
}

export async function getDiagnosisRun(id: string) {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("diagnosis_runs")
    .select("*")
    .eq("id", id)
    .single<DiagnosisRunRow>();
  if (error) throw new Error(error.message);
  return data;
}

