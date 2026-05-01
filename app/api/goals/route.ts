import {
  getGoalMapByIdForUser,
  listGoalMaps,
  listGoalStepsForMap,
  replaceGoalSteps,
  upsertGoalMap,
} from "@/app/state-check/_server/goalRepo";
import { commitmentPointsDelta } from "@/app/state-check/_server/goalCommitPoints";
import { requireUserId } from "@/app/state-check/_server/auth";
import { incrementMyPoints } from "@/app/state-check/_server/pointsRepo";

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

function parseOptionalDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const goals = await listGoalMaps({ userId, limit: 10 });
    const primary = goals[0] ?? null;
    const steps =
      primary?.id != null ? await listGoalStepsForMap(primary.id) : [];
    return Response.json({ ok: true, goals, steps });
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
    const payloadSteps = body.steps;

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
      big_goal_due_on: parseOptionalDate(body.big_goal_due_on),
      middle_goal_due_on: parseOptionalDate(body.middle_goal_due_on),
      small_goal_due_on: parseOptionalDate(body.small_goal_due_on),
    });

    let stepsOut = await listGoalStepsForMap(saved.id);
    if (Array.isArray(payloadSteps)) {
      const cleaned: { step_kind: "fixed" | "variable"; title: string; sort_order: number }[] = [];
      for (let i = 0; i < payloadSteps.length; i++) {
        const s = payloadSteps[i] as any;
        const kind =
          s?.step_kind === "fixed" || s?.step_kind === "variable"
            ? s.step_kind
            : null;
        const title =
          typeof s?.title === "string" ? s.title.trim().slice(0, 240) : "";
        if (!kind || !title) continue;
        const so = Number(s?.sort_order);
        cleaned.push({
          step_kind: kind,
          title,
          sort_order: Number.isFinite(so) ? Math.floor(so) : i,
        });
      }
      await replaceGoalSteps(saved.id, cleaned);
      stepsOut = await listGoalStepsForMap(saved.id);
    }

    let points: number | undefined;
    if (total > 0) {
      points = await incrementMyPoints(total);
    }
    return Response.json({
      ok: true,
      goal: saved,
      steps: stepsOut,
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

