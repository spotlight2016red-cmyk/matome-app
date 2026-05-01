"use client";

import * as React from "react";
import type { NextMove } from "../_lib/nextMove";

export function NextMoveCard({
  move,
  onCommitToNextStep,
  onSuggestAlternative,
}: {
  move: NextMove;
  /** 黒ボタン: いまやる、と決めたあとの導線（例: メモ欄へスクロール） */
  onCommitToNextStep?: () => void;
  onSuggestAlternative: () => void;
}) {
  const [didAckDo, setDidAckDo] = React.useState(false);
  const [couldNotOpen, setCouldNotOpen] = React.useState(false);

  React.useEffect(() => {
    setDidAckDo(false);
    setCouldNotOpen(false);
  }, [move.id]);

  const handleDoNow = () => {
    setDidAckDo(true);
    onCommitToNextStep?.();
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
      <div className="text-xs text-gray-500 mb-1">参考の1歩（診断）</div>
      <h2 className="text-xl sm:text-2xl font-semibold tracking-wide text-gray-900">
        {move.label}
      </h2>
      <p className="mt-2 text-xs text-gray-600 leading-relaxed">
        ゴールは自分で決めたまま。「今日の1歩」に取り込んでから動くと進めやすくなります。
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3">
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
          今日はできなかった
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
