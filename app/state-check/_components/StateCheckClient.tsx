"use client";

import * as React from "react";
import { STATE_CHECK_QUESTIONS } from "../_lib/questions";
import { computeStateCheck, isAllAnswered } from "../_lib/logic";
import type { AnswerMap, QuestionOptionId } from "../_lib/types";
import { QuestionCard } from "./QuestionCard";
import { ResultCard } from "./ResultCard";
import { InsightEditor } from "./InsightEditor";
import { HistoryList, type DiagnosisRunSummary } from "./HistoryList";
import { TrendsPanel } from "./TrendsPanel";
import { levelFromPoints, totalPoints } from "../_lib/points";

function answeredCount(answers: AnswerMap) {
  return STATE_CHECK_QUESTIONS.reduce(
    (n, q) => n + (answers[q.id] ? 1 : 0),
    0
  );
}

export function StateCheckClient() {
  const [answers, setAnswers] = React.useState<AnswerMap>({});
  const [mode, setMode] = React.useState<"form" | "result">("form");
  const [memo, setMemo] = React.useState("");
  const [runKind, setRunKind] = React.useState<"morning" | "extra" | "night">(
    "morning"
  );
  const [history, setHistory] = React.useState<DiagnosisRunSummary[]>([]);
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

  const allAnswered = isAllAnswered(answers);
  const done = answeredCount(answers);

  const points = React.useMemo(() => totalPoints(history), [history]);
  const { level, nextLevelAt } = React.useMemo(
    () => levelFromPoints(points),
    [points]
  );

  const computation = React.useMemo(() => {
    if (mode !== "result") return null;
    return computeStateCheck(answers);
  }, [answers, mode]);

  const refreshHistory = React.useCallback(async () => {
    const res = await fetch("/api/diagnosis", { method: "GET" });
    if (res.status === 401) {
      setSaveState({ kind: "error", message: "ログインしてください（保存・履歴が有効になります）" });
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

  React.useEffect(() => {
    void refreshHistory();
    void refreshTrends();
  }, [refreshHistory, refreshTrends]);

  const handlePick = React.useCallback(
    (questionId: string, optionId: QuestionOptionId) => {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    },
    []
  );

  const handleShowResult = () => {
    if (!allAnswered) return;
    setMode("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setAnswers({});
    setMode("form");
    setMemo("");
    setRunKind("morning");
    setSaveState({ kind: "idle" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveThisRun = async () => {
    if (!computation) return;
    setSaveState({ kind: "saving" });
    try {
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
        primary_action: computation.result.nextStep,
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
      await refreshHistory();
      await refreshTrends();
    } catch (e) {
      setSaveState({
        kind: "error",
        message: e instanceof Error ? e.message : "保存に失敗しました",
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Hero */}
      <section className="mb-8 sm:mb-10">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide text-gray-900">
            いまの自分の状態を整理する
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
            <span className="ui-pill ui-pill-hero">Lv.{level}</span>
            <span className="ui-pill">{points}pt / 次 {nextLevelAt}pt</span>
          </div>
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
          <ResultCard computation={computation} onReset={handleReset} />

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
            <div className="text-xs text-gray-500 mb-1">利用タイミング</div>
            <div className="text-sm text-gray-700 mb-3">
              午前のチェック（基本）/ 気になった時（任意）/ 夜の振り返りメモ（軽め）
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["morning", "午前チェック"],
                  ["extra", "追加チェック"],
                  ["night", "夜メモ"],
                ] as const
              ).map(([k, label]) => {
                const selected = runKind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setRunKind(k)}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm font-semibold",
                      selected
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                    ].join(" ")}
                    aria-pressed={selected}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <InsightEditor
            value={memo}
            onChange={setMemo}
            onSave={handleSaveThisRun}
            disabled={saveState.kind === "saving"}
          />

          {saveState.kind !== "idle" && (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
              {saveState.kind === "saving" && "保存中…"}
              {saveState.kind === "saved" && "保存しました。"}
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
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["morning", "午前チェック"],
                  ["extra", "追加チェック"],
                  ["night", "夜メモ"],
                ] as const
              ).map(([k, label]) => {
                const selected = runKind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setRunKind(k)}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm font-semibold",
                      selected
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                    ].join(" ")}
                    aria-pressed={selected}
                  >
                    {label}
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

