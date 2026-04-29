export type AvatarType = "guide" | "healer" | "guardian" | "explorer" | "transformer";

export function normalizeAvatarType(input: unknown): AvatarType {
  const v = String(input ?? "").trim().toLowerCase();
  if (v === "guide") return "guide";
  if (v === "healer") return "healer";
  if (v === "guardian") return "guardian";
  if (v === "explorer") return "explorer";
  if (v === "transformer") return "transformer";
  return "explorer";
}

export function getAvatarFallbackImage(): string {
  // Keep this stable and always-present.
  return "/avatars/explorer/lv1.jpg";
}

function levelToFile(level: number): "lv1" | "lv2" | "lv3" | "lv4" | "lv5" | "divine" {
  const l = Math.max(1, Math.min(6, Math.floor(level)));
  if (l >= 6) return "divine";
  switch (l) {
    case 1:
      return "lv1";
    case 2:
      return "lv2";
    case 3:
      return "lv3";
    case 4:
      return "lv4";
    case 5:
      return "lv5";
    default:
      return "lv1";
  }
}

function fileBaseToCandidates(fileBase: "lv1" | "lv2" | "lv3" | "lv4" | "lv5" | "divine"): string[] {
  // Requirement says "lv*.png or divine.jpg".
  // We try png first (for future assets) then jpg (current assets), and let UI fallback handle missing files.
  if (fileBase === "divine") return ["divine.jpg"];
  return [`${fileBase}.png`, `${fileBase}.jpg`];
}

/**
 * Generate avatar image path from type + level.
 *
 * - `divine.jpg` is used when (level >= 6) OR (points >= 400) OR (isDivine === true).
 * - Missing images should be handled by the <img onError> fallback in UI.
 */
export function getAvatarImage(
  type: AvatarType,
  level: number,
  opts?: { points?: number; isDivine?: boolean }
): string {
  return getAvatarImageCandidates(type, level, opts)[0] ?? getAvatarFallbackImage();
}

export function getAvatarImageCandidates(
  type: AvatarType,
  level: number,
  opts?: { points?: number; isDivine?: boolean }
): string[] {
  const t = normalizeAvatarType(type);
  const divineByPoints = Number.isFinite(opts?.points) && Number(opts?.points) >= 400;
  const divine = Boolean(opts?.isDivine) || divineByPoints || Math.floor(level) >= 6;
  const fileBase = divine ? "divine" : levelToFile(level);
  return fileBaseToCandidates(fileBase).map((file) => `/avatars/${t}/${file}`);
}

