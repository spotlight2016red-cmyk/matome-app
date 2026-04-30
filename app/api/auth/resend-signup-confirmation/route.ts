import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

export const runtime = "nodejs";

type UserRow = {
  email?: string | null;
  email_confirmed_at?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function findUserByEmailScanningPages(
  admin: ReturnType<typeof supabaseAdmin>,
  targetEmail: string,
): Promise<UserRow | null> {
  const normalized = normalizeEmail(targetEmail);
  let page = 1;
  const perPage = 1000;
  const maxPages = 100;

  while (page <= maxPages) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }
    const users = (data?.users ?? []) as UserRow[];
    const match = users.find((u) => (u.email ?? "").toLowerCase() === normalized);
    if (match) return match;
    if (users.length < perPage) return null;
    page += 1;
  }
  return null;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", message: "JSON ボディが不正です。" },
      { status: 400 },
    );
  }

  const emailRaw =
    body && typeof body === "object" && "email" in body && typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email
      : "";
  const redirectOrigin =
    body && typeof body === "object" && "redirectOrigin" in body && typeof (body as { redirectOrigin: unknown }).redirectOrigin === "string"
      ? (body as { redirectOrigin: string }).redirectOrigin.trim()
      : "";

  const email = emailRaw.trim();
  if (!email) {
    return NextResponse.json(
      { ok: false, code: "MISSING_EMAIL", message: "メールアドレスを入力してください。" },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = supabaseAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[resend-signup-confirmation] admin client init failed:", msg);
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_CONFIG",
        message: "サーバー設定が不足しています（SUPABASE_SERVICE_ROLE_KEY など）。管理者に連絡してください。",
        debug: { adminInitError: msg },
      },
      { status: 503 },
    );
  }

  let authUser: UserRow | null = null;
  try {
    authUser = await findUserByEmailScanningPages(admin, email);
  } catch (e) {
    const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e);
    console.error("[resend-signup-confirmation] listUsers failed:", e);
    return NextResponse.json(
      {
        ok: false,
        code: "ADMIN_LOOKUP_FAILED",
        message: "ユーザー情報の取得に失敗しました。時間をおいて再度お試しください。",
        debug: { error: msg },
      },
      { status: 500 },
    );
  }

  if (!authUser) {
    console.info("[resend-signup-confirmation] user not found for email:", normalizeEmail(email));
    return NextResponse.json(
      {
        ok: false,
        code: "USER_NOT_FOUND",
        message:
          "このメールアドレスでの登録が見つかりませんでした。入力ミスや別のメールで登録していないか確認してください。まだ登録していない場合は「新規登録」からお試しください。",
        debug: { email: normalizeEmail(email) },
      },
      { status: 200 },
    );
  }

  if (authUser.email_confirmed_at) {
    console.info("[resend-signup-confirmation] already confirmed:", normalizeEmail(email));
    return NextResponse.json(
      {
        ok: false,
        code: "ALREADY_CONFIRMED",
        message:
          "確認済みです。ログインしてください。パスワードを忘れた場合はログイン画面の「パスワードを忘れた・再設定メールを送る」から再設定できます。",
        debug: { email: normalizeEmail(email) },
      },
      { status: 200 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, code: "SERVER_CONFIG", message: "Supabase の公開環境変数がサーバーに設定されていません。" },
      { status: 503 },
    );
  }

  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const emailRedirectTo =
    redirectOrigin && /^https?:\/\//i.test(redirectOrigin) ? `${redirectOrigin.replace(/\/$/, "")}/login` : undefined;

  const resendEmail = (authUser.email ?? email).trim();

  const { data, error } = await anon.auth.resend({
    type: "signup",
    email: resendEmail,
    ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
  });

  if (error) {
    console.error("[resend-signup-confirmation] resend failed:", {
      email: resendEmail,
      message: error.message,
      status: (error as { status?: number }).status,
    });
    return NextResponse.json(
      {
        ok: false,
        code: "RESEND_ERROR",
        message: error.message || "確認メールの再送に失敗しました。",
        debug: {
          email: resendEmail,
          supabaseMessage: error.message,
          supabaseName: (error as { name?: string }).name,
        },
      },
      { status: 200 },
    );
  }

  console.info("[resend-signup-confirmation] resend ok (GoTrue returned success):", {
    email: resendEmail,
    data,
  });

  return NextResponse.json({
    ok: true,
    message:
      "再送リクエストを処理しました。数分経っても届かない場合は迷惑メールフォルダ・受信設定を確認し、それでも届かない場合は管理者へお問い合わせください。",
    debug: { email: resendEmail, data },
  });
}
