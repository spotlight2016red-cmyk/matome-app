import type { GoalMapRow } from "./types";

/** 各階層を「初めて一文以上決めた」ときのボーナス（再編集では付与しない） */
export const GOAL_COMMIT_POINTS = {
  small: 10,
  middle: 12,
  big: 15,
} as const;

export function goalTierEmpty(s: unknown): boolean {
  return !String(s ?? "").trim();
}

type GoalTierFields = Pick<GoalMapRow, "small_goal" | "middle_goal" | "big_goal">;

/**
 * サーバーに保存されていた前回値が空で、今回の保存で初めて非空になった階層にポイントを付与する。
 */
export function commitmentPointsDelta(
  prev: GoalTierFields | null,
  next: GoalTierFields
): { total: number; small: number; middle: number; big: number } {
  const p: GoalTierFields = prev ?? {
    small_goal: "",
    middle_goal: "",
    big_goal: "",
  };
  const small =
    goalTierEmpty(p.small_goal) && !goalTierEmpty(next.small_goal)
      ? GOAL_COMMIT_POINTS.small
      : 0;
  const middle =
    goalTierEmpty(p.middle_goal) && !goalTierEmpty(next.middle_goal)
      ? GOAL_COMMIT_POINTS.middle
      : 0;
  const big =
    goalTierEmpty(p.big_goal) && !goalTierEmpty(next.big_goal) ? GOAL_COMMIT_POINTS.big : 0;
  return { total: small + middle + big, small, middle, big };
}
