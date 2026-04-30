import { supabaseBrowser } from "@/app/lib/supabase/browser";

export type ConfirmedAuthStatus = "guest" | "unconfirmed" | "confirmed";

/**
 * getUser で JWT を検証。メール未確認のセッションはサインアウトして unconfirmed を返す。
 * （クライアントコンポーネントからのみ呼ぶこと）
 */
export async function getConfirmedAuthStatus(): Promise<ConfirmedAuthStatus> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return "guest";
  if (!data.user.email_confirmed_at) {
    await sb.auth.signOut();
    return "unconfirmed";
  }
  return "confirmed";
}

/** ログイン後の遷移先。オープンリダイレクトを防ぐためアプリ内パスのみ。 */
export function safeAppNextPath(raw: string | null): string | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (!s.startsWith("/") || s.startsWith("//")) return null;
  if (s.includes("://") || s.includes("\\")) return null;
  const noHash = s.split("#")[0] ?? s;
  return noHash || null;
}
