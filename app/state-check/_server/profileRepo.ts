import { supabaseServer } from "@/app/lib/supabase/server";

import { normalizeAvatarType, type AvatarType } from "@/app/lib/avatarImage";

function rowAvatarToType(avatarType: unknown): AvatarType | null {
  if (avatarType == null) return null;
  if (typeof avatarType === "string" && avatarType.trim() === "") return null;
  return normalizeAvatarType(avatarType);
}

/**
 * 初回は user_profiles を avatar_type = null で作成する（診断前に型を決めない）。
 * 古い ensure_my_profile RPC が DB に残っていても、ここでは RPC を使わない。
 */
export async function ensureMyAvatarTypeOrNull(): Promise<AvatarType | null> {
  const sb = await supabaseServer();
  const { data: userData, error: userErr } = await sb.auth.getUser();
  if (userErr) throw new Error(userErr.message);
  const uid = userData.user?.id;
  if (!uid) throw new Error("Unauthorized");

  const { data: row, error: selErr } = await sb
    .from("user_profiles")
    .select("avatar_type")
    .eq("user_id", uid)
    .maybeSingle();

  if (selErr) throw new Error(selErr.message);

  if (row) {
    return rowAvatarToType(row.avatar_type);
  }

  const { error: insErr } = await sb.from("user_profiles").insert({
    user_id: uid,
    avatar_type: null,
  });

  if (insErr) {
    if (insErr.code === "23505") {
      const { data: row2, error: sel2 } = await sb
        .from("user_profiles")
        .select("avatar_type")
        .eq("user_id", uid)
        .maybeSingle();
      if (!sel2 && row2) {
        return rowAvatarToType(row2.avatar_type);
      }
    }
    throw new Error(insErr.message);
  }

  return null;
}

export async function setMyAvatarType(avatarType: AvatarType): Promise<void> {
  const sb = await supabaseServer();
  const { error } = await sb.rpc("set_my_avatar_type", { new_type: avatarType });
  if (error) throw new Error(error.message);
}

