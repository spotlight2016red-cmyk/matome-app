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
  // 列はマイグレーション順で揃わない環境があるため * にし、存在する列だけ返す（day_key 未適用で 500 になるのを防ぐ）
  const { data, error } = await sb
    .from("diagnosis_runs")
    .select("*")
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

