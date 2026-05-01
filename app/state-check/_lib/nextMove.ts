import type { StateCheckComputation } from "./logic";

export type NextMove = {
  id: string;
  label: string;
  ctaLabel: string;
  source:
    | "result.nextStep"
    | "result.quickActions"
    | "heatMode.actions"
    | "fallback";
};

function slugify(text: string): string {
  const s = text
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 42) || "move";
}

function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function uniqueNonEmpty(input: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    const t = normalizeText(raw);
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function makeMoveId(prefix: string, label: string, idx: number) {
  return `${prefix}-${slugify(label)}-${idx}`;
}

type Candidate = {
  label: string;
  source: NextMove["source"];
  priority: number;
};

function buildCandidates(computation: StateCheckComputation): Candidate[] {
  const primary = computation.result.nextStep;
  const quick = computation.result.quickActions ?? [];
  const heatActions = computation.heatMode?.actions ?? [];

  const heatHigh = computation.scores.heat >= 3;
  const confusionHigh = computation.scores.confusion >= 7;

  const signals = computation.debug?.signals ?? {};
  const highRecovery =
    computation.scores.recoveryNeed >= 7 ||
    (Boolean(signals.lowEnergy) && computation.scores.recoveryNeed >= 6);

  // Priority: always keep UI at "one thing", but the choice order matters.
  // 1) Recovery-first (reduce/restore)
  // 2) Overchoice / heat+confusion (narrow down)
  // 3) Goal context (when it's safe to act)
  // 4) Default primary nextStep
  // 4) Then other suggestions as fallback pool
  const pool = uniqueNonEmpty([primary, ...quick, ...heatActions]);

  const candidates: Candidate[] = [];

  for (const label of pool) {
    const source: Candidate["source"] =
      label === normalizeText(primary)
        ? "result.nextStep"
        : heatActions.some((x) => normalizeText(x) === label)
          ? "heatMode.actions"
          : "result.quickActions";

    let priority = 50;
    if (label === normalizeText(primary)) priority = 30;

    if (highRecovery) {
      // Prefer actions that explicitly say "休む/減らす/延期" in recovery-heavy states.
      if (/(休|寝|減|延期|やめ|やめる|保留)/.test(label)) priority = 0;
    } else if (confusionHigh || (heatHigh && confusionHigh) || Boolean(signals.optionsTooMany)) {
      // Prefer narrowing actions when overchoice/heat+confusion.
      if (/(1つ|絞|締|終|優先)/.test(label)) priority = 0;
    }

    candidates.push({ label, source, priority });
  }

  candidates.sort((a, b) => a.priority - b.priority);
  return candidates;
}

export function chooseNextMove(
  computation: StateCheckComputation,
  opts?: {
    excludedMoveIds?: readonly string[];
  }
): NextMove {
  const excluded = new Set((opts?.excludedMoveIds ?? []).filter(Boolean));
  const candidates = buildCandidates(computation);

  let idx = 0;
  for (const c of candidates) {
    const id = makeMoveId("nm", c.label, idx++);
    if (excluded.has(id)) continue;
    return {
      id,
      label: c.label,
      ctaLabel: `いま「${c.label}」する`,
      source: c.source,
    };
  }

  const fallbackLabel = computation.result.nextStep || "今日やることを1つに絞る";
  return {
    id: makeMoveId("nm", fallbackLabel, 999),
    label: fallbackLabel,
    ctaLabel: `いま「${fallbackLabel}」する`,
    source: "fallback",
  };
}

