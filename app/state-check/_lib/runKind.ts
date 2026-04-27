export type RunKind = "morning" | "checkin" | "night" | "extra";

export function isRunKind(v: unknown): v is RunKind {
  return v === "morning" || v === "checkin" || v === "night" || v === "extra";
}

export function normalizeRunKind(v: unknown): RunKind {
  return isRunKind(v) ? v : "extra";
}

