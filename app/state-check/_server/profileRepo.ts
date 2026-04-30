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
  const { error } = await sb.rpc("set_my_avatar_type", { new_type: avatarType });
  if (error) throw new Error(error.message);
}

