import { createDiagnosisRun, listDiagnosisRuns } from "@/app/state-check/_server/diagnosisRepo";
import { requireUserId } from "@/app/state-check/_server/auth";

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const runs = await listDiagnosisRuns({ limit: 30 });
    return Response.json({ ok: true, runs });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const body = (await request.json()) as any;
    if (!body || typeof body !== "object") return jsonError("Invalid body");

    // Minimal validation (phase1). Later replace with zod/valibot if desired.
    const required = [
      "result_type",
      "propulsion_score",
      "fatigue_score",
      "confusion_score",
      "recovery_score",
      "heat_score",
      "answers_json",
      "result_summary",
      "primary_action",
      "recovery_actions_json",
    ] as const;
    for (const k of required) {
      if (!(k in body)) return jsonError(`Missing field: ${k}`);
    }

    const created = await createDiagnosisRun({
      user_id: userId,
      run_kind:
        body.run_kind === "morning" ||
        body.run_kind === "night" ||
        body.run_kind === "checkin" ||
        body.run_kind === "extra"
          ? body.run_kind
          : "extra",
      day_key: typeof body.day_key === "string" ? body.day_key : undefined,
      result_type: String(body.result_type),
      propulsion_score: Number(body.propulsion_score),
      fatigue_score: Number(body.fatigue_score),
      confusion_score: Number(body.confusion_score),
      recovery_score: Number(body.recovery_score),
      heat_score: Number(body.heat_score ?? 0),
      answers_json: body.answers_json,
      result_summary: String(body.result_summary),
      primary_action: String(body.primary_action),
      recovery_actions_json: body.recovery_actions_json,
      heat_mode_title: body.heat_mode_title ?? null,
      heat_mode_body: body.heat_mode_body ?? null,
      heat_mode_actions_json: body.heat_mode_actions_json ?? null,
      note_text: typeof body.note_text === "string" ? body.note_text : null,
    });

    return Response.json({ ok: true, run: created });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}

