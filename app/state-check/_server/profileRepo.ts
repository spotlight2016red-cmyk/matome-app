import { supabaseServer } from "@/app/lib/supabase/server";

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

export async function ensureMyAvatarType(): Promise<AvatarType> {
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("ensure_my_profile");
  if (error) throw new Error(error.message);
  return normalizeAvatarType(data);
}

