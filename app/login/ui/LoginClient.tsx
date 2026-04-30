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
    return "メール認証済みの場合は、パスワードが違う可能性があります。パスワード再設定を試してください。";
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
  const [resetLoading, setResetLoading] = React.useState(false);
  const [recoveryOpen, setRecoveryOpen] = React.useState(false);
  const [newRecoveryPassword, setNewRecoveryPassword] = React.useState("");
  const [confirmRecoveryPassword, setConfirmRecoveryPassword] = React.useState("");
  const [recoverySubmitLoading, setRecoverySubmitLoading] = React.useState(false);

  React.useEffect(() => {
    const sb = supabaseBrowser();
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryOpen(true);
        setMessage(
          "パスワード再設定用のリンクから入りました。新しいパスワードを入力して更新してください。",
        );
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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

  const sendPasswordResetEmail = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setMessage("パスワード再設定メールを送るには、上のメールアドレスを入力してください。");
      return;
    }

    setResetLoading(true);
    setMessage(null);
    try {
      const sb = supabaseBrowser();
      const origin = window.location.origin;
      const { error } = await sb.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${origin}/login`,
      });
      if (error) throw error;
      setMessage(
        "パスワード再設定用のメールを送信しました。メール内のリンクを開き、表示された画面で新しいパスワードを設定してください。",
      );
    } catch (e) {
      setMessage(toJapaneseAuthError(e));
    } finally {
      setResetLoading(false);
    }
  };

  const submitNewPasswordAfterRecovery = async () => {
    if (newRecoveryPassword.length < 8) {
      setMessage("パスワードは8文字以上にしてください。");
      return;
    }
    if (newRecoveryPassword !== confirmRecoveryPassword) {
      setMessage("確認用パスワードが一致しません。");
      return;
    }

    setRecoverySubmitLoading(true);
    setMessage(null);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.updateUser({ password: newRecoveryPassword });
      if (error) throw error;
      setNewRecoveryPassword("");
      setConfirmRecoveryPassword("");
      setRecoveryOpen(false);
      setMessage("パスワードを更新しました。新しいパスワードでログインしてください。");
    } catch (e) {
      setMessage(toJapaneseAuthError(e));
    } finally {
      setRecoverySubmitLoading(false);
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

          {mode === "signin" && recoveryOpen && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
              <div className="text-sm font-semibold text-amber-950 mb-2">
                新しいパスワードを設定する
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label
                    htmlFor="recovery-password"
                    className="block text-xs font-semibold text-amber-900/80 mb-1"
                  >
                    新しいパスワード
                  </label>
                  <input
                    id="recovery-password"
                    type="password"
                    value={newRecoveryPassword}
                    onChange={(e) => setNewRecoveryPassword(e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="8文字以上"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="recovery-password-confirm"
                    className="block text-xs font-semibold text-amber-900/80 mb-1"
                  >
                    新しいパスワード（確認）
                  </label>
                  <input
                    id="recovery-password-confirm"
                    type="password"
                    value={confirmRecoveryPassword}
                    onChange={(e) => setConfirmRecoveryPassword(e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="もう一度入力"
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="button"
                  onClick={submitNewPasswordAfterRecovery}
                  disabled={
                    recoverySubmitLoading ||
                    !newRecoveryPassword ||
                    !confirmRecoveryPassword
                  }
                  className={[
                    "w-full rounded-2xl px-4 py-3 text-sm sm:text-base font-semibold",
                    "focus:outline-none focus:ring-2 focus:ring-amber-300",
                    recoverySubmitLoading || !newRecoveryPassword || !confirmRecoveryPassword
                      ? "bg-amber-100 text-amber-400 cursor-not-allowed"
                      : "bg-amber-900 text-white hover:bg-amber-800",
                  ].join(" ")}
                >
                  {recoverySubmitLoading ? "更新中…" : "パスワードを更新する"}
                </button>
              </div>
            </div>
          )}

          {mode === "signin" && (
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
              <button
                type="button"
                onClick={sendPasswordResetEmail}
                disabled={resetLoading || !email.trim()}
                className={[
                  "w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold",
                  "focus:outline-none focus:ring-2 focus:ring-gray-300",
                  resetLoading || !email.trim()
                    ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                ].join(" ")}
              >
                {resetLoading ? "送信中…" : "パスワードを忘れた・再設定メールを送る"}
              </button>
              <p className="text-xs text-gray-500 leading-relaxed px-1">
                上にメールアドレスを入力してから押してください。届いたメールのリンクから新しいパスワードを設定できます。
              </p>
              <button
                type="button"
                onClick={() => {
                  setResendEmail((resendEmail || email).trim());
                  setResendOpen((v) => !v);
                }}
                className="font-semibold underline underline-offset-2 text-left"
              >
                メール認証がまだのとき（確認メールの再送）
              </button>
            </div>
          )}

          {resendOpen && (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                確認メールを再送する（未認証の方のみ）
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">
                こちらは、
                <span className="font-semibold text-gray-800">
                  メールアドレスの確認がまだ完了していない（未認証の）アカウント
                </span>
                向けです。すでにメール確認済みのアカウントでは確認メールは再送されません。ログインできないときは上の「パスワード再設定メール」を試してください。
              </p>
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

