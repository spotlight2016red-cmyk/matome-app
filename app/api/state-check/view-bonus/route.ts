import { requireUserId } from "@/app/state-check/_server/auth";
import { getMyPoints, incrementMyPoints } from "@/app/state-check/_server/pointsRepo";
import { todayDayKeyJST } from "@/app/state-check/_lib/dayKey";
import { supabaseServer } from "@/app/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

/** 診断結果を表示した日に +1pt（同一日は1回まで）。記録の +10pt とは別。 */
export async function POST() {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const dayKey = todayDayKeyJST();
    const sb = await supabaseServer();

    const { error: insertError } = await sb.from("state_check_daily_view_bonus").insert({
      user_id: userId,
      day_key: dayKey,
    });

    if (insertError) {
      const code = (insertError as { code?: string }).code;
      if (code === "23505") {
        const points = await getMyPoints();
        return Response.json({ ok: true, awarded: false, points });
      }
      throw new Error(insertError.message);
    }

    const points = await incrementMyPoints(1);
    return Response.json({ ok: true, awarded: true, points, points_delta: 1 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}
