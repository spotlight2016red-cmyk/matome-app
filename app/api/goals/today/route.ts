import { todayDayKeyJST } from "@/app/state-check/_lib/dayKey";
import { requireUserId } from "@/app/state-check/_server/auth";
import {
  getGoalMapByIdForUser,
  getGoalStepByIdAndMap,
  insertGoalTodayAction,
  listGoalMaps,
  listGoalStepsForMap,
  listGoalTodayActions,
} from "@/app/state-check/_server/goalRepo";
import type { GoalTodayActionOrigin } from "@/app/state-check/_server/types";

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

const ORIGINS: GoalTodayActionOrigin[] = [
  "fixed_pick",
  "variable_pick",
  "diagnosis",
  "manual",
];

function isOrigin(v: unknown): v is GoalTodayActionOrigin {
  return typeof v === "string" && ORIGINS.includes(v as GoalTodayActionOrigin);
}

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const url = new URL(req.url);
    const dayKey =
      url.searchParams.get("day_key")?.trim().slice(0, 24) ||
      todayDayKeyJST();

    const goals = await listGoalMaps({ userId, limit: 1 });
    const goal = goals[0] ?? null;
    if (!goal) {
      return Response.json({
        ok: true,
        day_key: dayKey,
        goal: null,
        steps: [],
        actions: [],
        pending_first_title: null,
        has_completed_today: false,
      });
    }

    const steps = await listGoalStepsForMap(goal.id);
    const actions = await listGoalTodayActions({
      userId,
      goalMapId: goal.id,
      dayKey,
    });
    const pending = actions.filter((a) => a.status === "pending");
    const has_completed_today = actions.some((a) => a.status === "completed");

    return Response.json({
      ok: true,
      day_key: dayKey,
      goal,
      steps,
      actions,
      pending_first_title: pending[0]?.title ?? null,
      has_completed_today,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const body = (await request.json()) as Record<string, unknown>;
    const day_key =
      (typeof body.day_key === "string" && body.day_key.trim()) || todayDayKeyJST();

    let goal_map_id =
      typeof body.goal_map_id === "string" ? body.goal_map_id.trim() : "";

    const primary = await listGoalMaps({ userId, limit: 1 });
    const fallbackId = primary[0]?.id ?? "";
    if (!goal_map_id) goal_map_id = fallbackId;

    if (!goal_map_id) return jsonError("ゴールがありません", 404);

    const gm = await getGoalMapByIdForUser({ id: goal_map_id, userId });
    if (!gm) return jsonError("ゴールが見つかりません", 404);

    const title =
      typeof body.title === "string" ? body.title.trim().slice(0, 240) : "";
    if (!title) return jsonError("タイトルを入力してください");

    if (!isOrigin(body.origin))
      return jsonError("origin が不正です", 400);

    const origin = body.origin;
    let linked_step_id: string | null =
      typeof body.linked_step_id === "string"
        ? body.linked_step_id.trim()
        : null;

    if (linked_step_id) {
      const step = await getGoalStepByIdAndMap({
        stepId: linked_step_id,
        goalMapId: goal_map_id,
      });
      if (!step) return jsonError("紐づく1歩が見つかりません", 400);
      if (origin === "fixed_pick" && step.step_kind !== "fixed") {
        return jsonError("固定の1歩として選べません", 400);
      }
      if (origin === "variable_pick" && step.step_kind !== "variable") {
        return jsonError("変動の1歩として選べません", 400);
      }
    } else if (origin === "fixed_pick" || origin === "variable_pick") {
      return jsonError("linked_step_id が必要です", 400);
    }

    const row = await insertGoalTodayAction({
      userId,
      goalMapId: goal_map_id,
      dayKey: day_key,
      title,
      origin,
      linkedStepId: linked_step_id || null,
    });

    return Response.json({ ok: true, action: row });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}
