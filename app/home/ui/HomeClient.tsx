"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getConfirmedAuthStatus } from "@/app/lib/confirmedSession";
import { levelFromPoints, totalPoints } from "@/app/state-check/_lib/points";
import type { DiagnosisRunSummary } from "@/app/state-check/_components/HistoryList";
import { AvatarGrowthCard } from "@/app/components/AvatarGrowthCard";
import { todayDayKeyJST } from "@/app/state-check/_lib/dayKey";
import { avatarDiagnosisRedoHref } from "@/app/lib/avatarDiagnosis";
import { normalizeAvatarType, type AvatarType } from "@/app/lib/avatarImage";
import {
  clearPendingAvatarType,
  peekPendingAvatarType,
} from "@/app/lib/avatarOptimisticSession";

export function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [history, setHistory] = React.useState<DiagnosisRunSummary[]>([]);
  const [serverPoints, setServerPoints] = React.useState<number | null>(null);
  const [avatarType, setAvatarType] = React.useState<AvatarType | null>(null);
  const [gain, setGain] = React.useState<number | null>(null);
  const [smallGoal, setSmallGoal] = React.useState<string | null>(null);
  const [todayProgress, setTodayProgress] = React.useState<number | null>(null);
  const dayKey = React.useMemo(() => todayDayKeyJST(), []);
  /** 初回フェッチ完了。未確定の間は AvatarGrowthCard を出さない（explorer フォールバックの誤解を防ぐ） */
  const [homeBootstrapDone, setHomeBootstrapDone] = React.useState(false);
  /** プロフィール API が失敗（診断未実施とは別。ここで診断へ飛ばすと診断直後の再送になりやすい） */
  const [profileFetchFailed, setProfileFetchFailed] = React.useState(false);
  /** 最後の /api/profile 失敗内容（原因切り分け用。サーバーが返す `error` または HTTP/HTML の先頭） */
  const [profileErrorHint, setProfileErrorHint] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const auth = await getConfirmedAuthStatus();
        if (!mounted) return;
        if (auth === "unconfirmed") {
          window.location.assign("/login?notice=email_unconfirmed");
          return;
        }
        const ok = auth === "confirmed";
        setAuthed(ok);
        if (!ok) {
          setHistory([]);
          setServerPoints(null);
          setAvatarType(null);
          setSmallGoal(null);
          setProfileFetchFailed(false);
          setProfileErrorHint(null);
          return;
        }
        setProfileFetchFailed(false);
        setProfileErrorHint(null);
        const optimisticAvatar = peekPendingAvatarType();
        // プロフィールは他 API と同時だと失敗しやすいので先に取り、短いバックオフで複数回試す。
        let profileRes: Response | null = null;
        let profileJson: { ok?: boolean; avatarType?: string | null; error?: string } | null =
          null;
        const profileAttempts = 5;
        for (let attempt = 0; attempt < profileAttempts; attempt++) {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 400));
          const res = await fetch("/api/profile", { method: "GET" });
          const text = await res.text();
          let json: { ok?: boolean; avatarType?: string | null; error?: string } = {};
          try {
            json = text ? (JSON.parse(text) as typeof json) : {};
          } catch {
            json = {
              ok: false,
              error: text ? `非JSON応答 (${text.slice(0, 160)}…)` : "空の応答",
            };
          }
          profileRes = res;
          profileJson = json;
          if (res.ok && json?.ok) break;
        }
        const [runsRes, pointsRes, goalsRes] = await Promise.all([
          fetch("/api/diagnosis", { method: "GET" }),
          fetch("/api/points", { method: "GET" }),
          fetch("/api/goals", { method: "GET" }),
        ]);
        const runsJson = (await runsRes.json()) as any;
        const pointsJson = (await pointsRes.json()) as any;
        const goalsJson = (await goalsRes.json()) as any;
        if (!mounted) return;
        if (runsJson?.ok) setHistory(runsJson.runs ?? []);
        if (pointsJson?.ok && typeof pointsJson.points === "number") {
          setServerPoints(Number(pointsJson.points));
        }
        if (profileRes?.ok && profileJson?.ok) {
          const at = profileJson.avatarType;
          if (at == null) {
            if (optimisticAvatar) {
              setAvatarType(optimisticAvatar);
              setProfileFetchFailed(false);
            } else {
              setAvatarType(null);
              setProfileFetchFailed(false);
              router.replace("/avatar-diagnosis?next=/home");
            }
          } else if (typeof at === "string") {
            setAvatarType(normalizeAvatarType(at));
            setProfileFetchFailed(false);
            clearPendingAvatarType();
          } else {
            if (optimisticAvatar) {
              setAvatarType(optimisticAvatar);
              setProfileFetchFailed(false);
            } else {
              setAvatarType(null);
              setProfileFetchFailed(false);
              router.replace("/avatar-diagnosis?next=/home");
            }
          }
        } else {
          if (optimisticAvatar) {
            setAvatarType(optimisticAvatar);
            setProfileFetchFailed(false);
          } else {
            setAvatarType(null);
            setProfileFetchFailed(true);
            const hint =
              typeof profileJson?.error === "string"
                ? profileJson.error
                : profileRes
                  ? `HTTP ${profileRes.status}`
                  : "プロフィール応答を解釈できませんでした";
            setProfileErrorHint(hint);
          }
        }
        if (goalsJson?.ok) {
          const first = (goalsJson.goals?.[0] ?? null) as any;
          const sg = typeof first?.small_goal === "string" ? first.small_goal.trim() : "";
          setSmallGoal(sg || null);
        } else {
          setSmallGoal(null);
        }
      } catch (e) {
        if (!mounted) return;
        // ログイン済みのままフェッチだけ失敗したケースを、誤ってログアウト表示にしない
        setAuthed((prev) => (prev === true ? true : prev));
        setHistory([]);
        setServerPoints(null);
        setAvatarType(null);
        setSmallGoal(null);
        setProfileFetchFailed(true);
        setProfileErrorHint(
          e instanceof Error ? e.message : "読み込み中にエラーが発生しました",
        );
      } finally {
        if (mounted) setHomeBootstrapDone(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(`goalProgress:v1:${dayKey}`);
    if (!raw) {
      setTodayProgress(0);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as any;
      if (parsed?.version === 1 && parsed?.dayKey === dayKey) {
        const p = Number(parsed.progress ?? 0);
        const clamped = Math.max(0, Math.min(100, Math.round(p)));
        setTodayProgress(clamped);
        return;
      }
    } catch {
      // ignore
    }
    setTodayProgress(0);
  }, [dayKey]);

  React.useEffect(() => {
    const raw = searchParams.get("gained");
    if (!raw) return;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return;
    const delta = Math.floor(n);
    setGain(delta);
    // +pt は /api/points の GET で揃う。ここではトーストのみ（router.replace だと再マウントと初回フェッチが競合しやすい）。
    const t = window.setTimeout(() => setGain(null), 1400);
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      if (u.searchParams.has("gained")) {
        u.searchParams.delete("gained");
        const next = `${u.pathname}${u.search}${u.hash}`;
        window.history.replaceState(window.history.state, "", next);
      }
    }
    return () => window.clearTimeout(t);
  }, [searchParams]);

  const points = React.useMemo(() => {
    if (typeof serverPoints === "number") return serverPoints;
    return totalPoints(history);
  }, [history, serverPoints]);
  const { level, nextLevelAt } = React.useMemo(
    () => levelFromPoints(points),
    [points]
  );

  const todayMove = React.useMemo(() => {
    const sg = (smallGoal ?? "").trim();
    const prog = typeof todayProgress === "number" ? todayProgress : 0;
    if (sg && prog < 100) return `小ゴールを進める：${sg}`;
    return "状態チェックで、次の一手を出す";
  }, [smallGoal, todayProgress]);

  return (
    <div className="mb-6">
      {authed === false ? (
        <div className="rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur px-6 py-6 text-sm text-gray-700">
          ログインすると、ポイント/レベルとアバター成長が有効になります。
        </div>
      ) : authed === null || !homeBootstrapDone ? (
        <div className="rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur px-6 py-10 text-center text-sm text-gray-600">
          読み込み中…
        </div>
      ) : authed === true && profileFetchFailed ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 shadow-sm backdrop-blur px-6 py-6 text-sm text-amber-950 space-y-3">
          <p>
            プロフィールを読み込めませんでした。一時的な通信エラーのことがあります。再読み込みするか、未診断の場合はアバター診断から進めてください。
          </p>
          {profileErrorHint ? (
            <div className="rounded-xl border border-amber-300/60 bg-white/90 px-3 py-2 text-xs text-amber-950 break-words">
              <span className="font-semibold">詳細（開発者向け）:</span> {profileErrorHint}
            </div>
          ) : null}
          <p className="text-xs text-amber-900/90">
            環境変数の有無は{" "}
            <a href="/api/env-check" className="underline font-semibold">
              /api/env-check
            </a>{" "}
            を別タブで開いて確認できます（Supabase URL / キーが false なら Vercel の設定不足です）。
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex flex-1 min-w-[140px] items-center justify-center rounded-2xl bg-amber-900 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              再読み込み
            </button>
            <button
              type="button"
              onClick={() => router.push("/avatar-diagnosis?next=/home")}
              className="inline-flex flex-1 min-w-[140px] items-center justify-center rounded-2xl border border-amber-900/40 bg-white px-4 py-3 text-sm font-semibold text-amber-950 hover:bg-amber-100/80 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              アバター診断へ
            </button>
          </div>
        </div>
      ) : authed === true && avatarType === null ? (
        <div className="rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur px-6 py-10 text-center text-sm text-gray-600">
          アバター診断へ移動しています…
        </div>
      ) : (
        <div className="space-y-3">
          {gain && (
            <div className="text-sm font-semibold text-emerald-900">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
                +{gain}pt
              </span>
            </div>
          )}
          <AvatarGrowthCard
            avatarType={avatarType ?? undefined}
            level={level}
            points={points}
            nextLevelAt={nextLevelAt}
          />

          <section className="rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur px-6 py-6">
            <div className="text-xs text-gray-500 mb-2">今日の一手（1つだけ）</div>
            <div className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              {todayMove}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/state-check"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-gray-900 px-5 py-4 text-sm sm:text-base font-semibold text-white shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                いまやる
              </Link>
              <Link
                href="/state-check/goals"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm sm:text-base font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                ゴールを確認
              </Link>
              <Link
                href={avatarDiagnosisRedoHref("/home")}
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm sm:text-base font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                アバター再診断
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

