import type { GoalMapRow } from "./types";

export type GoalPointAward = { tier: "small" | "middle" | "big"; points: number };

const PTS = { small: 10, middle: 15, big: 20 } as const;

function blank(s: unknown): boolean {
  return !String(s ?? "").trim();
}

/**
 * 大・中・小ゴールの「本文」が空から非空になったときだけポイント（初回確定扱い）。
 * purpose や success_criteria のみの変更では付与しない。
 */
export function awardsForGoalTextCommit(
  previous: Pick<GoalMapRow, "small_goal" | "middle_goal" | "big_goal"> | null,
  saved: Pick<GoalMapRow, "small_goal" | "middle_goal" | "big_goal">
): { delta: number; awards: GoalPointAward[] } {
  const prev = previous ?? { small_goal: "", middle_goal: "", big_goal: "" };
  const awards: GoalPointAward[] = [];
  if (blank(prev.small_goal) && !blank(saved.small_goal)) {
    awards.push({ tier: "small", points: PTS.small });
  }
  if (blank(prev.middle_goal) && !blank(saved.middle_goal)) {
    awards.push({ tier: "middle", points: PTS.middle });
  }
  if (blank(prev.big_goal) && !blank(saved.big_goal)) {
    awards.push({ tier: "big", points: PTS.big });
  }
  const delta = awards.reduce((sum, a) => sum + a.points, 0);
  return { delta, awards };
}
