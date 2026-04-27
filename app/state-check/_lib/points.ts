export type RunKind = "morning" | "extra" | "night";

export type RunForPoints = {
  run_kind?: RunKind | null;
  heat_score?: number | null;
};

export function pointsForRun(run: RunForPoints): number {
  const kind = run.run_kind ?? "extra";
  const base = kind === "morning" ? 20 : kind === "night" ? 10 : 15;
  const heat = Math.max(0, Math.min(10, Number(run.heat_score ?? 0)));
  // Heat gives a small bonus to make "game feel" without biasing too hard.
  return base + Math.floor(heat / 2);
}

export function totalPoints(runs: RunForPoints[]): number {
  return runs.reduce((sum, r) => sum + pointsForRun(r), 0);
}

export function levelFromPoints(points: number): { level: number; nextLevelAt: number } {
  const p = Math.max(0, Math.floor(points));
  const level = Math.floor(p / 100) + 1;
  const nextLevelAt = level * 100;
  return { level, nextLevelAt };
}

