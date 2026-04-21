import { listDiagnosisRuns } from "@/app/state-check/_server/diagnosisRepo";
import { getDiagnosisRun } from "@/app/state-check/_server/diagnosisRepo";

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

function bump(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

export async function GET() {
  try {
    // 直近5件の詳細を読んで、ルールベースで傾向を出す（初期版）
    const summaries = await listDiagnosisRuns({ limit: 5 });
    const ids = summaries.map((s) => s.id);
    const details = await Promise.all(ids.map((id) => getDiagnosisRun(id)));

    const tendencyCounts: Record<string, number> = {};
    const recoveryCounts: Record<string, number> = {};

    for (const d of details) {
      const answers = (d as any).answers_json ?? {};
      // Q4: 圧・曖昧 → 消耗しやすい
      if (answers.q4_relationship === "c") {
        bump(tendencyCounts, "曖昧な依頼がある時に消耗しやすい");
      }
      // Q5: かなり疲れている → 思考が鈍る
      if (answers.q5_energy === "c") {
        bump(tendencyCounts, "疲れている時は決めきれなくなりやすい");
      }
      // Q7: かなり飲み込んでいる → 本音抑制
      if (answers.q7_honesty === "c") {
        bump(tendencyCounts, "疲れている時ほど本音を飲み込みやすい");
      }
      // Q3: 義務感 → 意味が薄いと消耗
      if (answers.q3_meaning === "c") {
        bump(tendencyCounts, "意味が腹落ちしない時は義務感で消耗しやすい");
      }
      // 熱量（Q8）×迷い
      const heat = Number((d as any).heat_score ?? 0);
      const confusion = Number((d as any).confusion_score ?? 0);
      if (heat >= 3 && confusion >= 7) {
        bump(tendencyCounts, "熱が高い時に広げすぎる傾向がある");
      }

      // 戻し方は primary_action と recovery_actions_json から頻出を拾う
      if (typeof (d as any).primary_action === "string") {
        bump(recoveryCounts, (d as any).primary_action);
      }
      const ras = (d as any).recovery_actions_json;
      if (Array.isArray(ras)) {
        for (const a of ras) if (typeof a === "string") bump(recoveryCounts, a);
      }
    }

    const recentTendencies = Object.entries(tendencyCounts)
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);

    const recoveryStyles = Object.entries(recoveryCounts)
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);

    return Response.json({ ok: true, recentTendencies, recoveryStyles });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}

