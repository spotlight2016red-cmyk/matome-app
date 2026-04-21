"use client";

import * as React from "react";
import { STATE_CHECK_QUESTIONS } from "../_lib/questions";
import { computeStateCheck, isAllAnswered } from "../_lib/logic";
import { deriveTrends } from "../_lib/trends";
import { loadStateCheckHistory, saveStateCheckHistory } from "../_lib/storage";
import type {
  AnswerMap,
  QuestionOptionId,
  StateCheckHistoryEntryV1,
  StateCheckSignals,
} from "../_lib/types";
import { QuestionCard } from "./QuestionCard";
import { ResultCard } from "./ResultCard";
import { InsightEditor } from "./InsightEditor";
import { HistoryList } from "./HistoryList";
import { TrendsPanel } from "./TrendsPanel";

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
  const [history, setHistory] = React.useState<StateCheckHistoryEntryV1[]>([]);

  const allAnswered = isAllAnswered(answers);
  const done = answeredCount(answers);

  const computation = React.useMemo(() => {
    if (mode !== "result") return null;
    return computeStateCheck(answers);
  }, [answers, mode]);

  React.useEffect(() => {
    setHistory(loadStateCheckHistory());
  }, []);

  const trends = React.useMemo(() => deriveTrends(history), [history]);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveThisRun = () => {
    if (!computation) return;
    const signals = computation.debug.signals as StateCheckSignals;
    const entry: StateCheckHistoryEntryV1 = {
      version: 1,
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      resultId: computation.debug.chosenId,
      resultName: computation.result.name,
      scores: computation.scores,
      answers,
      signals,
      memo: memo.trim(),
    };
    const next = [entry, ...history].slice(0, 100);
    saveStateCheckHistory(next);
    setHistory(next);
  };

  const handleClearHistory = () => {
    const next: StateCheckHistoryEntryV1[] = [];
    saveStateCheckHistory(next);
    setHistory(next);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Hero */}
      <section className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide text-gray-900 mb-3">
          いまの自分の状態を整理する
        </h1>
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

          <InsightEditor
            value={memo}
            onChange={setMemo}
            onSave={handleSaveThisRun}
            disabled={memo.trim().length === 0}
          />

          <TrendsPanel
            recentTendencies={trends.recentTendencies}
            recoveryStyles={trends.recoveryStyles}
          />

          <HistoryList history={history} onClear={handleClearHistory} />
        </div>
      ) : (
        <>
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
                7問すべて回答すると結果が表示できます。
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

