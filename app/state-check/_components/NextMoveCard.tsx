"use client";

import * as React from "react";
import type { NextMove } from "../_lib/nextMove";

export type SmallGoalCompleteResult = {
  ok: boolean;
  awarded?: boolean;
  guest?: boolean;
  completion_bonus_unconfigured?: boolean;
  error?: string;
};

export function NextMoveCard({
  move,
  onCommitToNextStep,
  onSuggestAlternative,
  onSmallGoalComplete,
  onScrollToMemo,
}: {
  move: NextMove;
  /** 小ゴール以外の「いま〜する」: メモ欄へ誘導 */
  onCommitToNextStep?: () => void;
  onSuggestAlternative: () => void;
  /** 小ゴール完了: サーバー付与 + 今日の進捗100% 反映（未ログイン時はローカルのみ） */
  onSmallGoalComplete?: () => Promise<SmallGoalCompleteResult>;
  /** 完了後の任意: メモ欄へ */
  onScrollToMemo?: () => void;
}) {
  const isSmallGoalMove = move.source === "goal.small_goal";
  const [didAckDo, setDidAckDo] = React.useState(false);
  const [couldNotOpen, setCouldNotOpen] = React.useState(false);
  const [deferSoft, setDeferSoft] = React.useState(false);
  const [goalPhase, setGoalPhase] = React.useState<
    "idle" | "working" | "done" | "dismissed" | "error"
  >("idle");
  const [goalError, setGoalError] = React.useState<string | null>(null);
  const [goalResult, setGoalResult] = React.useState<SmallGoalCompleteResult | null>(null);

  React.useEffect(() => {
    setDidAckDo(false);
    setCouldNotOpen(false);
    setDeferSoft(false);
    setGoalPhase("idle");
    setGoalError(null);
    setGoalResult(null);
  }, [move.id]);

  const handleDefaultDoNow = () => {
    setDidAckDo(true);
    onCommitToNextStep?.();
  };

  const handleSmallGoalComplete = async () => {
    if (!onSmallGoalComplete) return;
    setGoalPhase("working");
    setGoalError(null);
    try {
      const r = await onSmallGoalComplete();
      if (!r.ok) {
        setGoalPhase("error");
        setGoalError(r.error ?? "完了の記録に失敗しました");
        return;
      }
      setGoalResult(r);
      setGoalPhase("done");
    } catch {
      setGoalPhase("error");
      setGoalError("通信に失敗しました");
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
      <div className="text-xs text-gray-500 mb-1">次の一手（1つだけ）</div>
      <h2 className="text-xl sm:text-2xl font-semibold tracking-wide text-gray-900">
        {move.label}
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {isSmallGoalMove && onSmallGoalComplete ? (
          <>
            <button
              type="button"
              onClick={handleSmallGoalComplete}
              disabled={
                goalPhase === "working" ||
                goalPhase === "done" ||
                goalPhase === "dismissed"
              }
              className={[
                "w-full rounded-2xl px-4 py-4 text-sm sm:text-base font-semibold",
                "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950",
                "focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2",
                goalPhase === "working" ||
                goalPhase === "done" ||
                goalPhase === "dismissed"
                  ? "opacity-70 cursor-not-allowed"
                  : "",
              ].join(" ")}
            >
              {goalPhase === "working"
                ? "完了を記録中…"
                : goalPhase === "done" || goalPhase === "dismissed"
                  ? "完了済み"
                  : move.ctaLabel}
            </button>

            {goalPhase === "error" && goalError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {goalError}
              </div>
            )}

            {(goalPhase === "done" || goalPhase === "dismissed") && goalResult && (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950 leading-relaxed space-y-3"
                role="status"
                aria-live="polite"
              >
                <p className="font-semibold">小ゴールを今日完了として記録しました。</p>
                {goalResult.guest ? (
                  <p className="text-xs text-emerald-900/90">
                    今日の進捗をこの端末に保存しました。ログインすると、次回から完了時に
                    <span className="font-semibold"> +5pt</span>（1日1回）が付きます。
                  </p>
                ) : goalResult.completion_bonus_unconfigured ? (
                  <p className="text-xs text-amber-900">
                    完了は記録済みです。+5pt 用のサーバー設定がまだのため、ポイントはスキップされました（マイグレーション未適用の可能性）。
                  </p>
                ) : goalResult.awarded ? (
                  <p className="text-xs text-emerald-900/90">
                    <span className="font-semibold">+5pt</span> を付けました（1日1回）。メモは任意です。
                  </p>
                ) : (
                  <p className="text-xs text-emerald-900/90">
                    今日の小ゴール完了の <span className="font-semibold">+5pt</span>
                    は、すでに本日付与済みでした。メモは任意です。
                  </p>
                )}
                {goalPhase === "done" ? (
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onScrollToMemo?.()}
                      className="inline-flex flex-1 items-center justify-center rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      ひとこと記録する
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoalPhase("dismissed")}
                      className="inline-flex flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      今はしない
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-600 pt-1">
                    メモは下の「あとから育つ診断にするためのメモ」からいつでも書けます。
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleDefaultDoNow}
              className={[
                "w-full rounded-2xl px-4 py-4 text-sm sm:text-base font-semibold",
                "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950",
                "focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2",
              ].join(" ")}
            >
              {move.ctaLabel}
            </button>

            {didAckDo && (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 leading-relaxed"
                role="status"
                aria-live="polite"
              >
                了解です。下のメモに一行だけ残して「記録する」と、今日の整理が残ります（+10pt）。
              </div>
            )}
          </>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => {
              setCouldNotOpen(true);
              setDeferSoft(false);
            }}
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline underline-offset-2"
          >
            今日はできなかった
          </button>
          <button
            type="button"
            onClick={() => {
              setDeferSoft(true);
              setCouldNotOpen(false);
            }}
            className="text-sm font-semibold text-gray-500 hover:text-gray-800 underline underline-offset-2"
          >
            あとでやる
          </button>
        </div>

        {deferSoft && !couldNotOpen && (
          <p className="text-xs text-gray-600 leading-relaxed">
            了解です。進捗はそのままにしておきます。別の一手が欲しいときは「今日はできなかった」から選べます。
          </p>
        )}

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
