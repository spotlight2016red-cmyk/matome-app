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
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline underline-offset-2"
        >
          ← ホームへ
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide text-gray-900 mb-3">
        {mode === "signup" ? "新規登録" : "ログイン"}
      </h1>
      <p className="text-sm text-gray-700 leading-relaxed mb-6">
        診断データをユーザーごとに保存するためにログインします。
      </p>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          メール
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
          placeholder="you@example.com"
        />

        <label className="mt-4 block text-xs font-semibold text-gray-600 mb-1">
          パスワード
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
          placeholder="8文字以上"
        />

        {message && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={loading || !email || !password}
          className={[
            "mt-4 w-full rounded-2xl px-4 py-4 text-sm sm:text-base font-semibold",
            "focus:outline-none focus:ring-2 focus:ring-gray-300",
            loading || !email || !password
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-800",
          ].join(" ")}
        >
          {loading ? "処理中…" : mode === "signup" ? "登録する" : "ログインする"}
        </button>

        <div className="mt-4 text-sm text-gray-700">
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
  );
}

