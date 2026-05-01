import { getGoalMapByIdForUser, listGoalMaps, upsertGoalMap } from "@/app/state-check/_server/goalRepo";
import { commitmentPointsDelta } from "@/app/state-check/_server/goalCommitPoints";
import { requireUserId } from "@/app/state-check/_server/auth";
import { incrementMyPoints } from "@/app/state-check/_server/pointsRepo";

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
    const idRaw = typeof body.id === "string" ? body.id.trim() : "";
    let prev: Awaited<ReturnType<typeof getGoalMapByIdForUser>> = null;
    if (idRaw) {
      prev = await getGoalMapByIdForUser({ id: idRaw, userId });
      if (!prev) return jsonError("ゴールが見つかりません", 404);
    }
    const nextTiers = {
      small_goal: String(body.small_goal ?? ""),
      middle_goal: String(body.middle_goal ?? ""),
      big_goal: String(body.big_goal ?? ""),
    };
    const { total, small, middle, big } = commitmentPointsDelta(prev, nextTiers);
    const saved = await upsertGoalMap({
      id: idRaw || undefined,
      user_id: userId,
      big_goal: nextTiers.big_goal,
      middle_goal: nextTiers.middle_goal,
      small_goal: nextTiers.small_goal,
      big_goal_purpose: body.big_goal_purpose ?? null,
      middle_goal_purpose: body.middle_goal_purpose ?? null,
      small_goal_purpose: body.small_goal_purpose ?? null,
      success_criteria: body.success_criteria ?? null,
    });
    let points: number | undefined;
    if (total > 0) {
      points = await incrementMyPoints(total);
    }
    return Response.json({
      ok: true,
      goal: saved,
      ...(total > 0
        ? {
            goal_commit_points: { small, middle, big, total },
            points,
          }
        : {}),
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}

