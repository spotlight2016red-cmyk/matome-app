import { requireUserId } from "@/app/state-check/_server/auth";
import { listDaySummaries, upsertDaySummary } from "@/app/state-check/_server/daySummaryRepo";

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const summaries = await listDaySummaries({ limit: 30 });
    return Response.json({ ok: true, summaries });
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
    if (typeof body.day_key !== "string") return jsonError("Missing day_key");

    const saved = await upsertDaySummary({
      user_id: userId,
      day_key: body.day_key,
      drift_text: typeof body.drift_text === "string" ? body.drift_text : null,
      recovered_text:
        typeof body.recovered_text === "string" ? body.recovered_text : null,
      tomorrow_step_text:
        typeof body.tomorrow_step_text === "string" ? body.tomorrow_step_text : null,
    });
    return Response.json({ ok: true, summary: saved });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}

