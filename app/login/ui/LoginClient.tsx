"use client";

import * as React from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/app/lib/supabase/browser";

export function LoginClient() {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const sb = supabaseBrowser();
      if (mode === "signup") {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("アカウントを作成しました。ログインしてください。");
        setMode("signin");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("ログインしました。");
        window.location.href = "/state-check";
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "失敗しました");
    } finally {
      setLoading(false);
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

