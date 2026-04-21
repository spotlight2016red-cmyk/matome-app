import { getDiagnosisRun } from "@/app/state-check/_server/diagnosisRepo";
import { type NextRequest } from "next/server";
import { requireUserId } from "@/app/state-check/_server/auth";

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/diagnosis/[id]">) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const { id } = await ctx.params;
    if (!id) return jsonError("Missing id");
    const run = await getDiagnosisRun(id);
    return Response.json({ ok: true, run });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}

