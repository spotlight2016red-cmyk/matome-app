"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATE_CHECK_QUESTIONS } from "../_lib/questions";
import { computeStateCheck, isAllAnswered } from "../_lib/logic";
import { chooseNextMove } from "../_lib/nextMove";
import { todayDayKeyJST } from "../_lib/dayKey";
import type { AnswerMap, QuestionOptionId } from "../_lib/types";
import { QuestionCard } from "./QuestionCard";
import { ResultCard } from "./ResultCard";
import { InsightEditor } from "./InsightEditor";
import { HistoryList, type DiagnosisRunSummary } from "./HistoryList";
import { TrendsPanel } from "./TrendsPanel";
import { levelFromPoints, totalPoints } from "../_lib/points";
import { getConfirmedAuthStatus } from "@/app/lib/confirmedSession";
import { AvatarGrowthCard } from "@/app/components/AvatarGrowthCard";
import { avatarDiagnosisRedoHref } from "@/app/lib/avatarDiagnosis";
import { normalizeAvatarType, type AvatarType } from "@/app/lib/avatarImage";
import type {
  GoalStepRow,
  GoalTodayActionRow,
  GoalTodayActionOrigin,
} from "../_server/types";

const POINT_RULES: readonly { label: string; points: number }[] = [
  { label: "診断を完了（結果を見る・1日1回）", points: 1 },
  { label: "診断を記録", points: 10 },
  { label: "今日の1歩を完了（1歩につき初回）", points: 3 },
];

function saveErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    const m = e.message || "保存に失敗しました";
    if (m.includes("ログイン")) return "ログインが必要です。ログイン後にもう一度お試しください。";
    if (m.toLowerCase().includes("jwt")) return "ログイン状態が切れました。もう一度ログインしてください。";
    return m;
  }
  return "保存に失敗しました";
}

function runKindCardMeta(kind: "morning" | "extra" | "night") {
  if (kind === "morning") {
    return { title: "午前チェック", desc: "今日の土台を作る（基本）" };
  }
  if (kind === "night") {
    return { title: "夜メモ", desc: "戻れた/ズレたを軽く記録" };
  }
  return { title: "気になった時", desc: "違和感を早めに回収する" };
}

function answeredCount(answers: AnswerMap) {
  return STATE_CHECK_QUESTIONS.reduce(
    (n, q) => n + (answers[q.id] ? 1 : 0),
    0
  );
}

export function StateCheckClient() {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<AnswerMap>({});
  const [mode, setMode] = React.useState<"form" | "result">("form");
  const [memo, setMemo] = React.useState("");
  const [runKind, setRunKind] = React.useState<"morning" | "extra" | "night">(
    "morning"
  );
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [history, setHistory] = React.useState<DiagnosisRunSummary[]>([]);
  const [smallGoal, setSmallGoal] = React.useState<string | null>(null);
  const [goalMapId, setGoalMapId] = React.useState<string | null>(null);
  const [goalSteps, setGoalSteps] = React.useState<GoalStepRow[]>([]);
  const [todayActions, setTodayActions] = React.useState<GoalTodayActionRow[]>(
    []
  );
  const [todayPackLoading, setTodayPackLoading] = React.useState(false);
  const dayKey = React.useMemo(() => todayDayKeyJST(), []);
  const [serverPoints, setServerPoints] = React.useState<number | null>(null);
  const [avatarType, setAvatarType] = React.useState<AvatarType | null>(null);
  const [ptGain, setPtGain] = React.useState<
    null | { delta: number; key: string; caption?: string }
  >(null);
  /** 診断結果表示まわりの +1pt（pending→API で確定。結果エリアに表示） */
  const [viewBonusLine, setViewBonusLine] = React.useState<
    null | "pending" | "awarded" | "already_today" | "skipped_config" | "failed"
  >(null);
  /** React Strict 等で同じ表示セッションに二度 POST したとき、付与済みを「本日分済み」で上書きしない */
  const viewBonusAwardedLatchRef = React.useRef(false);
  const [levelUp, setLevelUp] = React.useState<null | { toLevel: number; key: string }>(null);
  const [saveToast, setSaveToast] = React.useState<null | {
    kind: "saving" | "saved" | "error";
    delta: number;
    pointsAfter: number;
    nextLevelAt: number;
    tomorrowStep: string;
  }>(null);
  const [trendState, setTrendState] = React.useState<{
    recentTendencies: string[];
    recoveryStyles: string[];
  }>({ recentTendencies: [], recoveryStyles: [] });
  const [saveState, setSaveState] = React.useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  /** 初回プロフィール取得前は AvatarGrowthCard を出さない（未診断と explorer 画像の誤解防止） */
  const [profileFetchDone, setProfileFetchDone] = React.useState(false);

  const allAnswered = isAllAnswered(answers);
  const done = answeredCount(answers);

  const points = React.useMemo(() => {
    if (typeof serverPoints === "number") return serverPoints;
    return totalPoints(history);
  }, [history, serverPoints]);
  const { level, nextLevelAt } = React.useMemo(
    () => levelFromPoints(points),
    [points]
  );

  const closeSaveToast = React.useCallback(() => setSaveToast(null), []);

  const prevLevelRef = React.useRef<number>(level);
  React.useEffect(() => {
    const prev = prevLevelRef.current;
    if (level > prev) {
      setLevelUp({ toLevel: level, key: String(Date.now()) });
      window.setTimeout(() => setLevelUp(null), 1600);
    }
    prevLevelRef.current = level;
  }, [level]);

  const computation = React.useMemo(() => {
    if (mode !== "result") return null;
    return computeStateCheck(answers);
  }, [answers, mode]);

  const nextMove = React.useMemo(() => {
    if (!computation) return null;
    return chooseNextMove(computation);
  }, [computation]);

  const refreshGoal = React.useCallback(async () => {
    const res = await fetch("/api/goals", { method: "GET" });
    if (res.status === 401) {
      setSmallGoal(null);
      setGoalMapId(null);
      setGoalSteps([]);
      return;
    }
    const json = (await res.json()) as any;
    if (!json?.ok) {
      setSmallGoal(null);
      setGoalMapId(null);
      setGoalSteps([]);
      return;
    }
    const first = (json.goals?.[0] ?? null) as { id?: string; small_goal?: string } | null;
    const sg = typeof first?.small_goal === "string" ? first.small_goal.trim() : "";
    setSmallGoal(sg || null);
    setGoalMapId(typeof first?.id === "string" ? first.id : null);
    setGoalSteps(Array.isArray(json.steps) ? (json.steps as GoalStepRow[]) : []);
  }, [router]);

  const refreshTodayPack = React.useCallback(async () => {
    setTodayPackLoading(true);
    try {
      const res = await fetch(
        `/api/goals/today?day_key=${encodeURIComponent(dayKey)}`,
        { method: "GET" }
      );
      if (res.status === 401) {
        setTodayActions([]);
        return;
      }
      const json = (await res.json()) as {
        ok?: boolean;
        actions?: GoalTodayActionRow[];
        steps?: GoalStepRow[];
        goal?: { small_goal?: string; id?: string } | null;
      };
      if (!json?.ok) {
        setTodayActions([]);
        return;
      }
      setTodayActions(Array.isArray(json.actions) ? json.actions : []);
      if (Array.isArray(json.steps) && json.steps.length > 0) {
        setGoalSteps(json.steps as GoalStepRow[]);
      }
      const g = json.goal;
      if (g && typeof g.small_goal === "string") {
        const t = g.small_goal.trim();
        setSmallGoal(t || null);
      }
      if (g && typeof g.id === "string") setGoalMapId(g.id);
    } finally {
      setTodayPackLoading(false);
    }
  }, [dayKey]);

  const refreshHistory = React.useCallback(async () => {
    const res = await fetch("/api/diagnosis", { method: "GET" });
    if (res.status === 401) {
      setHistory([]);
      return;
    }
    const json = (await res.json()) as any;
    if (json?.ok) setHistory(json.runs ?? []);
  }, []);

  const refreshTrends = React.useCallback(async () => {
    const res = await fetch("/api/insights", { method: "GET" });
    if (res.status === 401) {
      setTrendState({ recentTendencies: [], recoveryStyles: [] });
      return;
    }
    const json = (await res.json()) as any;
    if (json?.ok) {
      setTrendState({
        recentTendencies: json.recentTendencies ?? [],
        recoveryStyles: json.recoveryStyles ?? [],
      });
    }
  }, []);

  const refreshPoints = React.useCallback(async () => {
    const res = await fetch("/api/points", { method: "GET" });
    if (res.status === 401) {
      setServerPoints(null);
      return;
    }
    const json = (await res.json()) as any;
    if (json?.ok && typeof json.points === "number") {
      setServerPoints(Number(json.points));
    }
  }, []);

  const refreshProfile = React.useCallback(async () => {
    const res = await fetch("/api/profile", { method: "GET" });
    if (res.status === 401) {
      setAvatarType(null);
      return;
    }
    const json = (await res.json()) as any;
    if (!json?.ok) return;
    const at = json.avatarType;
    if (at == null) {
      setAvatarType(null);
      router.replace("/avatar-diagnosis?next=/state-check");
      return;
    }
    if (typeof at === "string") setAvatarType(normalizeAvatarType(at));
  }, [router]);

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
        if (ok) {
          void refreshHistory();
          void refreshTrends();
          void refreshGoal();
          void refreshTodayPack();
          void refreshPoints();
          await refreshProfile();
          if (mounted) setProfileFetchDone(true);
        } else {
          setHistory([]);
          setTrendState({ recentTendencies: [], recoveryStyles: [] });
          setSmallGoal(null);
          setGoalMapId(null);
          setGoalSteps([]);
          setTodayActions([]);
          setServerPoints(null);
          setAvatarType(null);
          setProfileFetchDone(true);
        }
      } catch {
        if (!mounted) return;
        setAuthed(false);
        setHistory([]);
        setTrendState({ recentTendencies: [], recoveryStyles: [] });
        setSmallGoal(null);
        setGoalMapId(null);
        setGoalSteps([]);
        setTodayActions([]);
        setServerPoints(null);
        setAvatarType(null);
        setProfileFetchDone(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshGoal, refreshHistory, refreshPoints, refreshProfile, refreshTodayPack, refreshTrends]);

  React.useEffect(() => {
    if (mode !== "result" || authed !== true) return;
    void refreshTodayPack();
  }, [mode, authed, refreshTodayPack]);

  const addTodayStep = React.useCallback(
    async (input: {
      title: string;
      origin: GoalTodayActionOrigin;
      linked_step_id?: string | null;
    }) => {
      const res = await fetch("/api/goals/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_key: dayKey,
          goal_map_id: goalMapId ?? undefined,
          title: input.title,
          origin: input.origin,
          linked_step_id: input.linked_step_id ?? null,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (res.status === 401) throw new Error("ログインが必要です");
      if (!json?.ok) throw new Error(json?.error ?? "追加に失敗しました");
    },
    [dayKey, goalMapId]
  );

  const patchTodayStep = React.useCallback(
    async (
      actionId: string,
      body: {
        status?: "pending" | "completed" | "skipped";
        completion_note?: string | null;
      }
    ): Promise<{ points_delta?: number; points?: number }> => {
      const res = await fetch(`/api/goals/today/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        points?: number;
        points_delta?: number;
      };
      if (res.status === 401) throw new Error("ログインが必要です");
      if (!json?.ok) throw new Error(json?.error ?? "更新に失敗しました");
      if (typeof json.points === "number") setServerPoints(json.points);
      return {
        points_delta: Number(json.points_delta ?? 0) || undefined,
        points:
          typeof json.points === "number" ? Number(json.points) : undefined,
      };
    },
    []
  );

  const handlePick = React.useCallback(
    (questionId: string, optionId: QuestionOptionId) => {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    },
    []
  );

  const handleShowResult = () => {
    if (!allAnswered) return;
    viewBonusAwardedLatchRef.current = false;
    if (authed === true) {
      setViewBonusLine("pending");
    } else {
      setViewBonusLine(null);
    }
    setMode("result");
  };

  React.useEffect(() => {
    if (mode !== "result") return;
    const el = document.getElementById("state-check-diagnosis-result");
    if (!el) return;
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [mode]);

  React.useEffect(() => {
    if (mode !== "result" || authed !== true) return;
    let cancelled = false;
    void (async () => {
      setViewBonusLine((prev) =>
        prev === "awarded" || prev === "already_today" ? prev : "pending"
      );
      try {
        const res = await fetch("/api/state-check/view-bonus", { method: "POST" });
        if (cancelled) return;
        if (res.status === 401) {
          if (!cancelled) setViewBonusLine(null);
          return;
        }
        const json = (await res.json()) as {
          ok?: boolean;
          awarded?: boolean;
          points?: number;
          view_bonus_unconfigured?: boolean;
          error?: string;
        };
        if (!json?.ok || typeof json.points !== "number") {
          if (!cancelled) setViewBonusLine("failed");
          return;
        }
        setServerPoints(json.points);
        if (json.view_bonus_unconfigured) {
          if (!cancelled) setViewBonusLine("skipped_config");
          return;
        }
        if (json.awarded) {
          viewBonusAwardedLatchRef.current = true;
          setViewBonusLine("awarded");
          const linger = 5200;
          setPtGain({
            delta: 1,
            key: String(Date.now()),
            caption:
              "いま、この画面で診断結果が表示されたタイミングで +1pt を付けました（1日1回）。メモを記録すると別に +10pt。",
          });
          window.setTimeout(() => {
            if (!cancelled) setPtGain(null);
          }, linger);
        } else {
          if (cancelled) return;
          if (viewBonusAwardedLatchRef.current) return;
          setViewBonusLine("already_today");
        }
      } catch {
        if (!cancelled) setViewBonusLine("failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, authed]);

  const handleReset = () => {
    setAnswers({});
    setMode("form");
    setMemo("");
    setRunKind("morning");
    setSaveState({ kind: "idle" });
    viewBonusAwardedLatchRef.current = false;
    setViewBonusLine(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToInsight = React.useCallback(() => {
    document.getElementById("state-check-insight")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.setTimeout(() => {
      document.getElementById("state-check-insight-note")?.focus({ preventScroll: true });
    }, 450);
  }, []);

  const handleSaveThisRun = async () => {
    if (!computation) return;
    setSaveState({ kind: "saving" });
    try {
      // Instant "feel-good" toast (optimistic +10).
      const optimisticDelta = 10;
      const optimisticPointsAfter = points + optimisticDelta;
      const optimisticLevel = levelFromPoints(optimisticPointsAfter);
      setSaveToast({
        kind: "saving",
        delta: optimisticDelta,
        pointsAfter: optimisticPointsAfter,
        nextLevelAt: optimisticLevel.nextLevelAt,
        tomorrowStep: computation.result.nextStep,
      });

      const move = nextMove ?? chooseNextMove(computation);
      const payload = {
        run_kind: runKind,
        result_type: computation.result.name,
        propulsion_score: computation.scores.propulsion,
        fatigue_score: computation.scores.exhaustion,
        confusion_score: computation.scores.confusion,
        recovery_score: computation.scores.recoveryNeed,
        heat_score: computation.scores.heat,
        answers_json: answers,
        result_summary: computation.result.description,
        primary_action: move.label,
        recovery_actions_json: computation.result.quickActions,
        heat_mode_title: computation.heatMode?.title ?? null,
        heat_mode_body: computation.heatMode?.body ?? null,
        heat_mode_actions_json: computation.heatMode?.actions ?? null,
        note_text: memo,
      };
      const res = await fetch("/api/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as any;
      if (res.status === 401) throw new Error("ログインしてください（保存が有効になります）");
      if (!json?.ok) throw new Error(json?.error ?? "保存に失敗しました");
      setSaveState({ kind: "saved" });
      setMemo("");
      const delta = Number(json.points_delta ?? 10);
      const safeDelta = Number.isFinite(delta) ? delta : 10;
      const newServerPoints =
        typeof json.points === "number" ? Number(json.points) : null;
      if (typeof newServerPoints === "number") setServerPoints(newServerPoints);

      setPtGain({ delta: safeDelta, key: String(Date.now()) });
      window.setTimeout(() => setPtGain(null), 1300);

      const pointsAfter =
        typeof newServerPoints === "number"
          ? newServerPoints
          : points + safeDelta;
      const lvl = levelFromPoints(pointsAfter);
      setSaveToast({
        kind: "saved",
        delta: safeDelta,
        pointsAfter,
        nextLevelAt: lvl.nextLevelAt,
        tomorrowStep: computation.result.nextStep,
      });

      await refreshHistory();
      await refreshTrends();
      window.setTimeout(() => {
        window.location.assign(`/home?gained=${safeDelta}`);
      }, 900);
    } catch (e) {
      setSaveState({
        kind: "error",
        message: saveErrorMessage(e),
      });
      setSaveToast({
        kind: "error",
        delta: 10,
        pointsAfter: points + 10,
        nextLevelAt: levelFromPoints(points + 10).nextLevelAt,
        tomorrowStep: computation.result.nextStep,
      });
    }
  };

  React.useEffect(() => {
    if (saveState.kind !== "saved") return;
    const t = window.setTimeout(() => setSaveState({ kind: "idle" }), 2500);
    return () => window.clearTimeout(t);
  }, [saveState.kind]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {saveToast && (
        <div className="fixed inset-x-0 bottom-4 z-50 px-4">
          <div className="mx-auto w-full max-w-2xl">
            <div
              className={[
                "rounded-2xl border shadow-lg backdrop-blur bg-white/95 px-5 py-4",
                saveToast.kind === "saved"
                  ? "border-emerald-200"
                  : saveToast.kind === "error"
                    ? "border-rose-200"
                    : "border-gray-200",
                "animate-[toastIn_180ms_ease-out]",
              ].join(" ")}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">
                    {saveToast.kind === "saving"
                      ? "記録中…"
                      : saveToast.kind === "saved"
                        ? "記録しました"
                        : "保存に失敗しました"}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-900">
                      +{saveToast.delta}pt
                    </span>
                    <span className="text-gray-700">
                      現在 {Math.max(0, Math.floor(saveToast.pointsAfter))}pt
                    </span>
                    <span className="text-gray-500">
                      {levelFromPoints(saveToast.pointsAfter).level >= 6
                        ? "（神化）"
                        : `次まで ${Math.max(0, saveToast.nextLevelAt - Math.floor(saveToast.pointsAfter))}pt`}
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="text-xs font-semibold text-gray-600 mb-1">
                      明日の一手
                    </div>
                    <div className="text-sm text-gray-900 leading-relaxed">
                      {saveToast.tomorrowStep}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeSaveToast}
                  className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  閉じる
                </button>
              </div>
            </div>
            <style jsx>{`
              @keyframes toastIn {
                0% {
                  opacity: 0;
                  transform: translateY(8px);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </div>
        </div>
      )}
      {/* Hero */}
      <section className="mb-8 sm:mb-10">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide text-gray-900">
            いまの自分の状態を整理する
          </h1>
          {authed === false && (
            <div className="text-[11px] text-gray-600">
              <span className="ui-pill">未ログイン（保存はログイン後）</span>
            </div>
          )}
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          <a
            href="/home"
            title="成長のホーム（マイページ）"
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            ホームへ
          </a>
          <Link
            href={avatarDiagnosisRedoHref("/state-check")}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            アバター再診断
          </Link>
          <Link
            href="/state-check/goals"
            className={[
              "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold",
              "focus:outline-none focus:ring-2 focus:ring-gray-300",
              goalMapId && smallGoal?.trim()
                ? "border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50"
                : "bg-gray-900 text-white shadow-md hover:bg-gray-800",
            ].join(" ")}
          >
            {goalMapId && smallGoal?.trim() ? "ゴールを確認" : "ゴールを作る"}
          </Link>
        </div>
        {ptGain &&
          (ptGain.caption ? (
            <div
              key={ptGain.key}
              className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
              role="status"
              aria-live="polite"
            >
              <div className="font-semibold">+{ptGain.delta}pt</div>
              <p className="mt-1.5 text-xs leading-relaxed opacity-95">{ptGain.caption}</p>
            </div>
          ) : (
            <div
              key={ptGain.key}
              className="mb-3 text-sm font-semibold text-emerald-900"
            >
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 animate-[fadeUp_1.2s_ease-out_forwards]">
                +{ptGain.delta}pt
              </span>
              <style jsx>{`
                @keyframes fadeUp {
                  0% {
                    opacity: 0;
                    transform: translateY(6px);
                  }
                  15% {
                    opacity: 1;
                    transform: translateY(0);
                  }
                  85% {
                    opacity: 1;
                    transform: translateY(-2px);
                  }
                  100% {
                    opacity: 0;
                    transform: translateY(-6px);
                  }
                }
              `}</style>
            </div>
          ))}
        {levelUp && (
          <div key={levelUp.key} className="mb-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 animate-[pop_1.6s_ease-out_forwards]">
              LEVEL UP ・ Lv.{levelUp.toLevel}
            </div>
            <style jsx>{`
              @keyframes pop {
                0% {
                  opacity: 0;
                  transform: translateY(6px) scale(0.98);
                }
                12% {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
                88% {
                  opacity: 1;
                  transform: translateY(-2px) scale(1);
                }
                100% {
                  opacity: 0;
                  transform: translateY(-6px) scale(0.98);
                }
              }
            `}</style>
          </div>
        )}
        <div className="mt-4">
          {authed === true && !profileFetchDone ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-3xl border border-gray-200 bg-gray-50 px-6 text-sm text-gray-500">
              読み込み中…
            </div>
          ) : (
            <AvatarGrowthCard
              avatarType={avatarType ?? undefined}
              level={level}
              points={points}
              nextLevelAt={nextLevelAt}
              variant="status"
            />
          )}
        </div>
        <div className="mt-3 text-xs text-gray-600">
          {POINT_RULES.map((r) => (
            <div key={r.label}>
              {r.label}：+{r.points}pt
            </div>
          ))}
          <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">
            「診断を完了」の +1pt は、<strong className="font-semibold text-gray-600">「診断結果を見る」を押して、このページに結果が出た直後</strong>
            に付きます（ログイン時・1日1回）。まずはその場で「確認中→付与しました」と表示されます。
          </p>
        </div>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
          いくつかの質問に答えるだけで、今どこにいて、このままだとどうなりやすいか、そして次に何を整えると良いかが分かります。
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            これは性格診断ではなく、“今の状態”を整理するためのものです。
          </p>
        </div>
      </section>

      {mode === "result" && computation ? (
        <div className="space-y-8">
          <div id="state-check-diagnosis-result" className="scroll-mt-4 space-y-4">
            {viewBonusLine === "pending" && (
              <div
                className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 leading-relaxed"
                role="status"
                aria-live="polite"
              >
                <span className="font-semibold text-sky-900">確認中</span>
                … いまこの画面に診断結果が出たことをサーバーに伝え、
                <span className="font-semibold"> +1pt（1日1回）</span>
                を付けられるか判定しています。
              </div>
            )}
            {viewBonusLine === "awarded" && (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 leading-relaxed"
                role="status"
                aria-live="polite"
              >
                <span className="font-semibold">+1pt</span>
                を付けました。
                <span className="block mt-1.5 text-xs opacity-95">
                  タイミング：「診断結果を見る」を押して、この結果が表示された直後です（ログイン時・1日1回）。
                </span>
                メモを「記録する」と
                <span className="font-semibold"> さらに +10pt</span>（別ルール）です。
              </div>
            )}
            {viewBonusLine === "already_today" && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 leading-relaxed">
                今日の「診断を完了」<span className="font-semibold">+1pt</span>
                は、すでに別の回で付与済みです（同じ日に2回目は付きません）。メモを記録すると
                <span className="font-semibold"> +10pt</span> が別に付きます。
              </div>
            )}
            {viewBonusLine === "skipped_config" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 leading-relaxed">
                診断結果はそのままご利用できます。
                <span className="block mt-1.5 text-xs text-amber-900/90">
                  <strong>+1pt</strong>（診断を完了）だけ、Supabase にボーナス用テーブルがまだ無い／権限が足りないため付けられていません。SQL
                  マイグレーション「<span className="font-mono">2026-05-07_state_check_daily_view_bonus.sql</span>
                  」を本番 DB に適用してください。メモの記録（<strong>+10pt</strong>）は別経路です。
                </span>
              </div>
            )}
            {viewBonusLine === "failed" && (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-900 leading-relaxed">
                ポイントの反映を確認できませんでした（通信または想定外のサーバーエラー）。ログイン状態と、しばらくしてからの再読み込みを試してください。
              </div>
            )}
            <ResultCard
              computation={computation}
              authed={authed === true}
              smallGoalTitle={smallGoal}
              todaySteps={goalSteps}
              todayActions={todayActions}
              todayPackLoading={todayPackLoading}
              onReset={handleReset}
              onCommitToNextStep={scrollToInsight}
              onRefreshTodayPack={refreshTodayPack}
              onAddTodayStep={addTodayStep}
              onPatchTodayStep={patchTodayStep}
              onTodayPoints={({ delta, points }) => {
                if (typeof points === "number") setServerPoints(points);
                if (delta > 0) {
                  setPtGain({ delta, key: String(Date.now()) });
                  window.setTimeout(() => setPtGain(null), 1300);
                }
              }}
            />
          </div>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
            <div className="text-xs text-gray-500 mb-1">利用タイミング</div>
            <div className="text-sm text-gray-700 mb-3">
              午前のチェック（基本）/ 気になった時（任意）/ 夜の振り返りメモ（軽め）
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  ["morning", "午前チェック"],
                  ["extra", "追加チェック"],
                  ["night", "夜メモ"],
                ] as const
              ).map(([k, label]) => {
                const selected = runKind === k;
                const meta = runKindCardMeta(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setRunKind(k)}
                    className={[
                      "rounded-2xl border px-4 py-3 text-left",
                      selected
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                    ].join(" ")}
                    aria-pressed={selected}
                  >
                    <div className="text-sm font-semibold">{meta.title}</div>
                    <div className={selected ? "text-xs text-white/80" : "text-xs text-gray-600"}>
                      {meta.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div id="state-check-insight" className="scroll-mt-6">
            <InsightEditor
              value={memo}
              onChange={setMemo}
              onSave={handleSaveThisRun}
              disabled={saveState.kind === "saving"}
              pointsHint="記録すると +10pt"
            />
          </div>

          {saveState.kind !== "idle" && (
            <div
              className={[
                "rounded-xl border px-4 py-3 text-sm",
                saveState.kind === "saved"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : saveState.kind === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : "border-gray-200 bg-white text-gray-700",
              ].join(" ")}
            >
              {saveState.kind === "saving" && "保存中…"}
              {saveState.kind === "saved" && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>記録しました +10pt（マイページに戻ります）</span>
                  <button
                    type="button"
                    onClick={() => window.location.assign("/home")}
                    className="font-semibold underline underline-offset-2"
                  >
                    今すぐ戻る
                  </button>
                </div>
              )}
              {saveState.kind === "error" && (
                <div className="flex flex-wrap items-center gap-2">
                  <span>{`保存に失敗: ${saveState.message}`}</span>
                  {saveState.message.includes("ログイン") && (
                    <a
                      href="/login"
                      className="font-semibold underline underline-offset-2"
                    >
                      ログインへ
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          <TrendsPanel
            recentTendencies={trendState.recentTendencies}
            recoveryStyles={trendState.recoveryStyles}
          />

          <HistoryList history={history} />

          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-6">
            <div className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
              次に整えるために
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="/state-check/history"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
              >
                履歴を見る
              </a>
              <a
                href="/state-check/goals"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
              >
                ゴール整理へ
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          <section className="mb-5 rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
            <div className="text-xs text-gray-500 mb-1">利用タイミング</div>
            <div className="text-sm text-gray-700 mb-3">
              午前のチェック（基本）/ 気になった時（任意）/ 夜の振り返りメモ（軽め）
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  ["morning", "午前チェック"],
                  ["extra", "追加チェック"],
                  ["night", "夜メモ"],
                ] as const
              ).map(([k, label]) => {
                const selected = runKind === k;
                const meta = runKindCardMeta(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setRunKind(k)}
                    className={[
                      "rounded-2xl border px-4 py-3 text-left",
                      selected
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                    ].join(" ")}
                    aria-pressed={selected}
                  >
                    <div className="text-sm font-semibold">{meta.title}</div>
                    <div className={selected ? "text-xs text-white/80" : "text-xs text-gray-600"}>
                      {meta.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Progress */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-sm text-gray-600">
              進捗: <span className="font-semibold text-gray-900">{done}</span> /{" "}
              {STATE_CHECK_QUESTIONS.length}
            </div>
            <div className="text-[11px] text-gray-500">
              1ページでまとめて回答できます
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {STATE_CHECK_QUESTIONS.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                value={answers[q.id]}
                onChange={(optId) => handlePick(q.id, optId)}
              />
            ))}
          </div>

          {/* CTA: show result */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleShowResult}
              disabled={!allAnswered}
              className={[
                "w-full rounded-2xl px-4 py-4 text-sm sm:text-base font-semibold",
                "focus:outline-none focus:ring-2 focus:ring-gray-300",
                allAnswered
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed",
              ].join(" ")}
            >
              診断結果を見る
            </button>
            {allAnswered && authed === true && (
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                押すと下に結果が開き、<span className="font-semibold">表示された直後</span>に今日の分の
                <span className="font-semibold"> +1pt</span>（1日1回）を付けます。まず「確認中」と出ます。
              </p>
            )}
            {allAnswered && authed === false && (
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                ログイン後は、結果が表示されたタイミングで +1pt（1日1回）が付くことがあります。
              </p>
            )}
            {!allAnswered && (
              <p className="mt-2 text-xs text-gray-500">
                {STATE_CHECK_QUESTIONS.length}問すべて回答すると結果が表示できます。
              </p>
            )}
          </div>
        </>
      )}

      {/* 補足 */}
      <section className="mt-10 sm:mt-12">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
          <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
            大事なのは、自分を責めることではなく、今どこにいるかを知ることです。
            <br />
            状態が分かれば、次の一手は選びやすくなります。
          </p>
        </div>
      </section>

      {/* CTA枠（将来用） */}
      <section className="mt-4 mb-12">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-6">
          <div className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
            次の一手を、もう少し一緒に整理したい方へ
          </div>
          <div className="text-sm text-gray-600">
            ここに今後、対話・案内・導線を追加予定
          </div>
        </div>
      </section>
    </div>
  );
}

