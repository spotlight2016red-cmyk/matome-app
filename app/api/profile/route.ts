import { requireUserId } from "@/app/state-check/_server/auth";
import { ensureMyAvatarType } from "@/app/state-check/_server/profileRepo";

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const avatarType = await ensureMyAvatarType();
    return Response.json({ ok: true, avatarType });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}

