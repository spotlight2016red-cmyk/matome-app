"use client";

import * as React from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/app/lib/supabase/browser";

function toJapaneseAuthError(e: unknown) {
  const raw =
    e && typeof e === "object" && "message" in e && typeof (e as any).message === "string"
      ? ((e as any).message as string)
      : "";

  const msg = raw.toLowerCase();

  if (!raw) return "失敗しました。時間をおいて再度お試しください。";
  if (msg.includes("missing env")) return raw;
  if (msg.includes("invalid login credentials"))
    return "メールアドレスまたはパスワードが違います。";
  if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed"))
    return "メールアドレスの確認が完了していません。確認メールのリンクを開いてからログインしてください。";
  if (msg.includes("user already registered"))
    return "このメールアドレスは既に登録されています。ログインしてください。";
  if (msg.includes("password") && msg.includes("characters"))
    return "パスワードが短すぎます。もう少し長いパスワードを設定してください。";
  if (
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("over_email_send_rate_limit")
  )
    return "短時間にリクエストが多すぎます。しばらく待ってからお試しください。";

  return raw;
}

export function LoginClient() {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [resendOpen, setResendOpen] = React.useState(false);
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendEmail, setResendEmail] = React.useState("");

  const submit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const sb = supabaseBrowser();
      if (mode === "signup") {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        setResendEmail(email);
        setResendOpen(true);
        setMessage(
          "確認メールを送信しました。メール内のリンクから認証した後にログインしてください。届かない場合は下のボタンから再送できます。",
        );
        setMode("signin");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("ログインしました。");
        window.location.href = "/home";
      }
    } catch (e) {
      setMessage(toJapaneseAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationEmail = async () => {
    const targetEmail = (resendEmail || email).trim();
    if (!targetEmail) {
      setMessage("メールアドレスを入力してください。");
      return;
    }

    setResendLoading(true);
    setMessage(null);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.resend({ type: "signup", email: targetEmail });
      if (error) throw error;
      setMessage(
        "確認メールを再送しました。届かない場合は迷惑メールフォルダや受信設定をご確認ください。",
      );
    } catch (e) {
      setMessage(toJapaneseAuthError(e));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-10">
        <div className="text-3xl tracking-widest text-gray-900 mb-2">
          SPOTLIGHT FILMS
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            ← ホームへ
          </Link>
          <Link
            href="/state-check"
            className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            自分の状態診断へ
          </Link>
          <div className="text-xs text-gray-500">
            いまの状態を整理して、次の一手を出す
          </div>
        </div>
      </div>

      <div className="ui-card px-6 py-7 sm:px-8 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide text-gray-900 mb-2">
            {mode === "signup" ? "新規登録" : "ログイン"}
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            診断データをユーザーごとに保存するためにログインします。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-gray-600 mb-1"
            >
              メール
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-gray-600 mb-1"
            >
              パスワード
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="8文字以上"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {message && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={loading || !email || !password}
            className={[
              "w-full rounded-2xl px-4 py-4 text-sm sm:text-base font-semibold",
              "focus:outline-none focus:ring-2 focus:ring-gray-300",
              loading || !email || !password
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-800",
            ].join(" ")}
          >
            {loading ? "処理中…" : mode === "signup" ? "登録する" : "ログインする"}
          </button>

          {mode === "signin" && (
            <div className="text-sm text-gray-700">
              <button
                type="button"
                onClick={() => {
                  setResendEmail((resendEmail || email).trim());
                  setResendOpen((v) => !v);
                }}
                className="font-semibold underline underline-offset-2"
              >
                確認メールが届かない場合はこちら
              </button>
            </div>
          )}

          {resendOpen && (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                確認メールを再送する
              </div>
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                />
                <button
                  type="button"
                  onClick={resendConfirmationEmail}
                  disabled={resendLoading || !(resendEmail || email).trim()}
                  className={[
                    "w-full rounded-2xl px-4 py-3 text-sm sm:text-base font-semibold",
                    "focus:outline-none focus:ring-2 focus:ring-gray-300",
                    resendLoading || !(resendEmail || email).trim()
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-900 text-white hover:bg-gray-800",
                  ].join(" ")}
                >
                  {resendLoading ? "再送中…" : "確認メールを再送する"}
                </button>
                <div className="text-xs text-gray-600 leading-relaxed">
                  迷惑メールフォルダ、受信拒否設定（特に携帯キャリアメール）、メールアドレスの入力ミスもご確認ください。
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-700">
            {mode === "signup" ? (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="font-semibold underline underline-offset-2"
              >
                すでにアカウントがある → ログイン
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-semibold underline underline-offset-2"
              >
                はじめて → 新規登録
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

