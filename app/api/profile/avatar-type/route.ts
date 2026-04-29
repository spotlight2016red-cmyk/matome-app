import { requireUserId } from "@/app/state-check/_server/auth";
import { setMyAvatarType } from "@/app/state-check/_server/profileRepo";
import { normalizeAvatarType, type AvatarType } from "@/app/lib/avatarImage";

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const body = (await req.json().catch(() => null)) as any;
    const raw = body?.avatarType;
    const v = String(raw ?? "").trim().toLowerCase();
    const allowed: readonly AvatarType[] = [
      "guide",
      "healer",
      "guardian",
      "explorer",
      "transformer",
    ];
    if (!allowed.includes(v as AvatarType)) {
      return jsonError("Invalid avatarType", 400);
    }
    const avatarType = normalizeAvatarType(v);
    await setMyAvatarType(avatarType);
    return Response.json({ ok: true, avatarType });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}

