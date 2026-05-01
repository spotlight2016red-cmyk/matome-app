import { requireUserId } from "@/app/state-check/_server/auth";
import { incrementMyPoints, getMyPoints } from "@/app/state-check/_server/pointsRepo";
import { todayDayKeyJST } from "@/app/state-check/_lib/dayKey";
import { supabaseServer } from "@/app/lib/supabase/server";

const SMALL_GOAL_COMPLETE_POINTS = 3;

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const body = (await request.json().catch(() => ({}))) as any;
    const smallGoal = typeof body?.small_goal === "string" ? body.small_goal.trim() : "";

    const dayKey = todayDayKeyJST();
    const sb = await supabaseServer();

    const { error: insertError } = await sb.from("state_check_small_goal_completions").insert({
      user_id: userId,
      day_key: dayKey,
      small_goal: smallGoal,
    });

    if (insertError) {
      const code = (insertError as { code?: string }).code;
      if (code === "23505") {
        const points = await getMyPoints();
        return Response.json({ ok: true, awarded: false, points, points_delta: 0 });
      }
      throw new Error(insertError.message);
    }

    const points = await incrementMyPoints(SMALL_GOAL_COMPLETE_POINTS);
    return Response.json({
      ok: true,
      awarded: true,
      points,
      points_delta: SMALL_GOAL_COMPLETE_POINTS,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}

