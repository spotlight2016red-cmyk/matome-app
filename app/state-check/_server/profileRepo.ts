import { supabaseServer } from "@/app/lib/supabase/server";

import { normalizeAvatarType, type AvatarType } from "@/app/lib/avatarImage";

export async function ensureMyAvatarTypeOrNull(): Promise<AvatarType | null> {
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("ensure_my_profile");
  if (error) throw new Error(error.message);
  if (data == null) return null;
  return normalizeAvatarType(data);
}

export async function setMyAvatarType(avatarType: AvatarType): Promise<void> {
  const sb = await supabaseServer();
  // Ensure row exists first (but don't decide the value here).
  const ensured = await sb.rpc("ensure_my_profile");
  if (ensured.error) throw new Error(ensured.error.message);

  const { data: userData, error: userErr } = await sb.auth.getUser();
  if (userErr) throw new Error(userErr.message);
  const userId = userData.user?.id ?? null;
  if (!userId) throw new Error("Unauthorized");

  const { error } = await sb
    .from("user_profiles")
    .update({ avatar_type: avatarType })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

