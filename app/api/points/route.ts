import { requireUserId } from "@/app/state-check/_server/auth";
import { incrementMyPoints } from "@/app/state-check/_server/pointsRepo";

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    // Use RPC to ensure the row exists and avoid "0 rows" edge cases.
    const points = await incrementMyPoints(0);
    return Response.json({ ok: true, points });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}

