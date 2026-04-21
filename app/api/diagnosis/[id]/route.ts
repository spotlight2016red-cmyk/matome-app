import { getDiagnosisRun } from "@/app/state-check/_server/diagnosisRepo";
import { type NextRequest } from "next/server";

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/diagnosis/[id]">) {
  try {
    const { id } = await ctx.params;
    if (!id) return jsonError("Missing id");
    const run = await getDiagnosisRun(id);
    return Response.json({ ok: true, run });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}

