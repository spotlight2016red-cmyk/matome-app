import { requireUserId } from "@/app/state-check/_server/auth";
import { getMyPoints, incrementMyPoints } from "@/app/state-check/_server/pointsRepo";
import { todayDayKeyJST } from "@/app/state-check/_lib/dayKey";
import { supabaseServer } from "@/app/lib/supabase/server";

const POINT_DELTA = 5;

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

function isTableMissingOrDenied(msg: string, code?: string): boolean {
  const m = msg.toLowerCase();
  const namesTable = m.includes("state_check_small_goal_completion");
  const looksMissing =
    code === "42P01" ||
    /does not exist|schema cache|could not find|not find the table/i.test(m);
  const looksDenied = code === "42501" || /permission denied/i.test(m);
  return namesTable && (looksMissing || looksDenied);
}

/** 診断結果で小ゴールを「今日完了」した日に +5pt（同一日は1回）。メモの +10pt とは別。 */
export async function POST() {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const dayKey = todayDayKeyJST();
    const sb = await supabaseServer();

    const { error: insertError } = await sb.from("state_check_small_goal_completion").insert({
      user_id: userId,
      day_key: dayKey,
    });

    if (insertError) {
      const code = (insertError as { code?: string }).code;
      const msg = insertError.message ?? "";
      if (code === "23505") {
        const points = await getMyPoints();
        return Response.json({ ok: true, awarded: false, points, points_delta: 0 });
      }
      if (isTableMissingOrDenied(msg, code)) {
        console.error("[complete-small-goal] table missing or denied:", insertError);
        const points = await getMyPoints();
        return Response.json({
          ok: true,
          awarded: false,
          points,
          completion_bonus_unconfigured: true,
        });
      }
      throw new Error(insertError.message);
    }

    const points = await incrementMyPoints(POINT_DELTA);
    return Response.json({
      ok: true,
      awarded: true,
      points,
      points_delta: POINT_DELTA,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}
