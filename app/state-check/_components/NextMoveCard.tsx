"use client";

import * as React from "react";
import type { NextMove } from "../_lib/nextMove";

export function NextMoveCard({
  move,
  onCommitToNextStep,
  onSuggestAlternative,
  onCompleteSmallGoal,
}: {
  move: NextMove;
  /** 黒ボタン: いまやる、と決めたあとの導線（例: メモ欄へスクロール） */
  onCommitToNextStep?: () => void;
  onSuggestAlternative: () => void;
  /** 小ゴールの場合: 完了処理（+pt や進捗100% など） */
  onCompleteSmallGoal?: (smallGoalName: string) => Promise<
    | { ok: true; awarded: boolean; pointsDelta: number }
    | { ok: false; message: string }
  >;
}) {
  const [didAckDo, setDidAckDo] = React.useState(false);
  const [couldNotOpen, setCouldNotOpen] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);
  const [completeResult, setCompleteResult] = React.useState<
    | null
    | { kind: "done"; awarded: boolean; pointsDelta: number }
    | { kind: "error"; message: string }
  >(null);
  const [afterCompleteChoiceOpen, setAfterCompleteChoiceOpen] = React.useState(false);

  React.useEffect(() => {
    setDidAckDo(false);
    setCouldNotOpen(false);
    setCompleting(false);
    setCompleteResult(null);
    setAfterCompleteChoiceOpen(false);
  }, [move.id]);

  const isSmallGoalMove = move.source === "goal.small_goal";
  const smallGoalName = React.useMemo(() => {
    const raw = move.label;
    const prefix = "小ゴールを進める：";
    if (!isSmallGoalMove) return "";
    if (raw.startsWith(prefix)) return raw.slice(prefix.length).trim();
    return raw.trim();
  }, [isSmallGoalMove, move.label]);

  const handleDoNow = () => {
    setDidAckDo(true);
    onCommitToNextStep?.();
  };

  const handleCompleteSmallGoal = async () => {
    if (!smallGoalName) return;
    if (!onCompleteSmallGoal) return;
    setCompleting(true);
    setCompleteResult(null);
    try {
      const res = await onCompleteSmallGoal(smallGoalName);
      if (!res.ok) {
        setCompleteResult({ kind: "error", message: res.message });
        return;
      }
      setCompleteResult({
        kind: "done",
        awarded: res.awarded,
        pointsDelta: res.pointsDelta,
      });
      setAfterCompleteChoiceOpen(true);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
      <div className="text-xs text-gray-500 mb-1">次の一手（1つだけ）</div>
      <h2 className="text-xl sm:text-2xl font-semibold tracking-wide text-gray-900">
        {move.label}
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {isSmallGoalMove ? (
          <button
            type="button"
            onClick={handleCompleteSmallGoal}
            disabled={completing || !smallGoalName}
            className={[
              "w-full rounded-2xl px-4 py-4 text-sm sm:text-base font-semibold",
              "focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2",
              completing || !smallGoalName
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950",
            ].join(" ")}
          >
            {completing
              ? "完了にしています…"
              : `「${smallGoalName || "小ゴール"}」を完了する`}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDoNow}
            className={[
              "w-full rounded-2xl px-4 py-4 text-sm sm:text-base font-semibold",
              "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950",
              "focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2",
            ].join(" ")}
          >
            {move.ctaLabel}
          </button>
        )}

        {isSmallGoalMove && completeResult?.kind === "done" && (
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 leading-relaxed"
            role="status"
            aria-live="polite"
          >
            {completeResult.awarded ? (
              <div className="font-semibold">完了しました +{completeResult.pointsDelta}pt</div>
            ) : (
              <div className="font-semibold">完了しました（今日はポイント付与済み）</div>
            )}
            {afterCompleteChoiceOpen && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAfterCompleteChoiceOpen(false);
                    onCommitToNextStep?.();
                  }}
                  className="rounded-xl bg-gray-900 text-white px-4 py-3 text-sm font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  ひとこと記録する
                </button>
                <button
                  type="button"
                  onClick={() => setAfterCompleteChoiceOpen(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  今はしない
                </button>
              </div>
            )}
          </div>
        )}

        {isSmallGoalMove && completeResult?.kind === "error" && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 leading-relaxed">
            {completeResult.message}
          </div>
        )}

        {didAckDo && (
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 leading-relaxed"
            role="status"
            aria-live="polite"
          >
            了解です。下のメモに一行だけ残して「記録する」と、今日の整理が残ります（+10pt）。
          </div>
        )}

        <button
          type="button"
          onClick={() => setCouldNotOpen(true)}
          className="justify-self-start text-left text-sm font-semibold text-gray-700 hover:text-gray-900 underline underline-offset-2"
        >
          {isSmallGoalMove ? "あとでやる" : "今日はできなかった"}
        </button>

        {couldNotOpen && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-gray-900 leading-relaxed space-y-3">
            <p>
              負担が大きかったり、いまの体力・時間と合わなかっただけかもしれません。無理に実行しなくて大丈夫です。
            </p>
            <p className="text-gray-700">
              少しだけハードルを下げた別の一手を出します。合わなければ、またこの下から選び直せます。
            </p>
            <button
              type="button"
              onClick={() => {
                onSuggestAlternative();
                setCouldNotOpen(false);
              }}
              className={[
                "w-full rounded-2xl px-4 py-3.5 text-sm sm:text-base font-semibold",
                "border border-amber-300 bg-white text-gray-900 shadow-sm",
                "hover:bg-amber-100/60 active:bg-amber-100",
                "focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2",
              ].join(" ")}
            >
              別の一手を見る
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
