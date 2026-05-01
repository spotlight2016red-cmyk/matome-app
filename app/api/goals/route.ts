import { getGoalMapByIdForUser, listGoalMaps, upsertGoalMap } from "@/app/state-check/_server/goalRepo";
import { awardsForGoalTextCommit } from "@/app/state-check/_server/goalCommitPoints";
import { incrementMyPoints } from "@/app/state-check/_server/pointsRepo";
import { requireUserId } from "@/app/state-check/_server/auth";

const GOAL_ROW_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isGoalRowId(raw: unknown): raw is string {
  return typeof raw === "string" && GOAL_ROW_ID_RE.test(raw);
}

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const goals = await listGoalMaps({ userId, limit: 10 });
    return Response.json({ ok: true, goals });
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
    const prev = isGoalRowId(body.id) ? await getGoalMapByIdForUser({ userId, id: body.id }) : null;
    const saved = await upsertGoalMap({
      id: body.id,
      user_id: userId,
      big_goal: String(body.big_goal ?? ""),
      middle_goal: String(body.middle_goal ?? ""),
      small_goal: String(body.small_goal ?? ""),
      big_goal_purpose: body.big_goal_purpose ?? null,
      middle_goal_purpose: body.middle_goal_purpose ?? null,
      small_goal_purpose: body.small_goal_purpose ?? null,
      success_criteria: body.success_criteria ?? null,
    });
    const { delta, awards } = awardsForGoalTextCommit(prev, saved);
    let points: number | undefined;
    if (delta > 0) {
      points = await incrementMyPoints(delta);
    }
    return Response.json({
      ok: true,
      goal: saved,
      ...(delta > 0 ? { points_delta: delta, points, goal_point_awards: awards } : {}),
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}

