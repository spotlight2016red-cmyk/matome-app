import type { RunKind } from "./runKind";
import { normalizeRunKind } from "./runKind";

export type RunForPoints = {
  run_kind?: RunKind | null | undefined;
  heat_score?: number | null;
};

export function pointsForRun(run: RunForPoints): number {
  const kind = normalizeRunKind(run.run_kind);
  const base =
    kind === "morning" ? 20 : kind === "night" ? 10 : kind === "checkin" ? 18 : 15;
  const heat = Math.max(0, Math.min(10, Number(run.heat_score ?? 0)));
  // Heat gives a small bonus to make "game feel" without biasing too hard.
  return base + Math.floor(heat / 2);
}

export function totalPoints(runs: RunForPoints[]): number {
  return runs.reduce((sum, r) => sum + pointsForRun(r), 0);
}

export function levelFromPoints(points: number): { level: number; nextLevelAt: number } {
  const p = Math.max(0, Math.floor(points));
  if (p < 30) return { level: 1, nextLevelAt: 30 };
  if (p < 80) return { level: 2, nextLevelAt: 80 };
  if (p < 150) return { level: 3, nextLevelAt: 150 };
  if (p < 250) return { level: 4, nextLevelAt: 250 };
  if (p < 400) return { level: 5, nextLevelAt: 400 };
  return { level: 6, nextLevelAt: 400 };
}

