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
          return;
        }
        const [runsRes, pointsRes, profileRes] = await Promise.all([
          fetch("/api/diagnosis", { method: "GET" }),
          fetch("/api/points", { method: "GET" }),
          fetch("/api/profile", { method: "GET" }),
        ]);
        const goalsRes = await fetch("/api/goals", { method: "GET" });
        const runsJson = (await runsRes.json()) as any;
        const pointsJson = (await pointsRes.json()) as any;
        const profileJson = (await profileRes.json()) as any;
        const goalsJson = (await goalsRes.json()) as any;
        if (!mounted) return;
        if (runsJson?.ok) setHistory(runsJson.runs ?? []);
        if (pointsJson?.ok && typeof pointsJson.points === "number") {
          setServerPoints(Number(pointsJson.points));
        }
        if (profileRes.ok && profileJson?.ok) {
          const at = profileJson.avatarType;
          if (at == null) {
            setAvatarType(null);
            router.replace("/avatar-diagnosis?next=/home");
          } else if (typeof at === "string") {
            setAvatarType(normalizeAvatarType(at));
          } else {
            setAvatarType(null);
          }
        } else {
          // プロフィール取得失敗時も未診断と同様に診断へ（再試行より先に型を確定できる可能性がある）
          setAvatarType(null);
          router.replace("/avatar-diagnosis?next=/home");
        }
        if (goalsJson?.ok) {
          const first = (goalsJson.goals?.[0] ?? null) as any;
          const sg = typeof first?.small_goal === "string" ? first.small_goal.trim() : "";
          setSmallGoal(sg || null);
        } else {
          setSmallGoal(null);
        }
      } catch {
        if (!mounted) return;
        setAuthed(false);
        setHistory([]);
        setServerPoints(null);
        setAvatarType(null);
        setSmallGoal(null);
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
    // Optimistic update so growth is felt immediately.
    setServerPoints((prev) => (typeof prev === "number" ? prev + delta : prev));
    const t = window.setTimeout(() => setGain(null), 1400);
    // Clean up URL to avoid showing again on refresh.
    router.replace("/home");
    return () => window.clearTimeout(t);
  }, [router, searchParams]);

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

