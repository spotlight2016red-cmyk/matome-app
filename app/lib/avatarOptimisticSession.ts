import { normalizeAvatarType, type AvatarType } from "@/app/lib/avatarImage";

const KEY = "matomeAvatarOptimistic";
const TTL_MS = 180_000;

type Payload = { type: string; savedAt: number };

/** 診断保存成功直後、ホーム初回描画でプロフィール GET が遅延・失敗しても型を表示できるようにする */
export function setPendingAvatarTypeAfterSave(avatarType: AvatarType): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ type: avatarType, savedAt: Date.now() }));
  } catch {
    // private mode 等
  }
}

function parsePending(raw: string | null): AvatarType | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<Payload>;
    if (typeof p.type !== "string" || typeof p.savedAt !== "number") return null;
    const age = Date.now() - p.savedAt;
    if (age < 0 || age >= TTL_MS) return null;
    return normalizeAvatarType(p.type);
  } catch {
    return null;
  }
}

/** 読み取りのみ（キーは残す）。再マウント・Strict 再実行でも消えないようにする */
export function peekPendingAvatarType(): AvatarType | null {
  if (typeof window === "undefined") return null;
  try {
    return parsePending(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function clearPendingAvatarType(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/**
 * 保存直後のペンディングを 1 回だけ取り出す（読んだらキーは消す）。
 * TTL を過ぎたら null。
 * @deprecated ホーム初回など複数回読まれると壊れるため `peekPendingAvatarType` + `clearPendingAvatarType` を使う
 */
export function consumePendingAvatarType(): AvatarType | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return parsePending(raw);
  } catch {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    return null;
  }
}
