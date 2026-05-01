import { type NextRequest } from "next/server";
import { requireUserId } from "@/app/state-check/_server/auth";
import { GOAL_TODAY_STEP_COMPLETE_POINTS } from "@/app/state-check/_server/goalTodayPoints";
import {
  getGoalTodayActionForUser,
  insertGoalTodayActionAward,
  patchGoalTodayAction,
} from "@/app/state-check/_server/goalRepo";
import type { GoalTodayActionStatus } from "@/app/state-check/_server/types";
import { incrementMyPoints } from "@/app/state-check/_server/pointsRepo";

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

function isStatus(v: unknown): v is GoalTodayActionStatus {
  return v === "pending" || v === "completed" || v === "skipped";
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ actionId: string }> }
) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const { actionId } = await ctx.params;
    if (!actionId) return jsonError("Missing actionId");

    const body = (await req.json()) as Record<string, unknown>;
    const hasStatus = Object.prototype.hasOwnProperty.call(body, "status");
    const hasCompletionNote = Object.prototype.hasOwnProperty.call(
      body,
      "completion_note"
    );

    if (!hasStatus && !hasCompletionNote) {
      return jsonError("status または completion_note が必要です", 400);
    }

    let nextStatusPatch: GoalTodayActionStatus | undefined;
    if (hasStatus) {
      if (!isStatus(body.status)) return jsonError("status が不正です", 400);
      nextStatusPatch = body.status;
    }

    let nextNote: string | null | undefined;
    if (hasCompletionNote) {
      const noteRaw = body.completion_note;
      if (noteRaw === null) nextNote = null;
      else if (typeof noteRaw === "string")
        nextNote = noteRaw.trim().slice(0, 800) || null;
      else return jsonError("completion_note が不正です", 400);
    }

    const prev = await getGoalTodayActionForUser({
      actionId,
      userId,
    });
    if (!prev) return jsonError("見つかりません", 404);

    const nextStatus = nextStatusPatch ?? prev.status;

    let points_delta = 0;
    let points: number | undefined;

    const becameCompleted =
      nextStatusPatch === "completed" && prev.status !== "completed";

    if (becameCompleted) {
      const first = await insertGoalTodayActionAward({ actionId, userId });
      if (first) {
        points = await incrementMyPoints(GOAL_TODAY_STEP_COMPLETE_POINTS);
        points_delta = GOAL_TODAY_STEP_COMPLETE_POINTS;
      }
    }

    const completed_at =
      nextStatusPatch !== undefined
        ? nextStatus === "completed"
          ? prev.completed_at ?? new Date().toISOString()
          : null
        : prev.completed_at;

    const updated = await patchGoalTodayAction({
      actionId,
      userId,
      patch: {
        ...(nextStatusPatch !== undefined
          ? {
              status: nextStatusPatch,
              completed_at,
            }
          : {}),
        ...(hasCompletionNote && nextNote !== undefined
          ? { completion_note: nextNote }
          : {}),
      },
    });

    return Response.json({
      ok: true,
      action: updated,
      ...(typeof points === "number" ? { points } : {}),
      points_delta,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}
