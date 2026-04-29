"use client";

import * as React from "react";
import type { NextMove } from "../_lib/nextMove";

export function NextMoveCard({
  move,
  onDoNow,
  onCouldNot,
  showAlternativeButton,
  onSuggestAlternative,
}: {
  move: NextMove;
  onDoNow: () => void;
  onCouldNot: () => void;
  showAlternativeButton: boolean;
  onSuggestAlternative: () => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
      <div className="text-xs text-gray-500 mb-1">次の一手（1つだけ）</div>
      <h2 className="text-xl sm:text-2xl font-semibold tracking-wide text-gray-900">
        {move.label}
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={onDoNow}
          className={[
            "w-full rounded-2xl px-4 py-4 text-sm sm:text-base font-semibold",
            "bg-gray-900 text-white hover:bg-gray-800",
            "focus:outline-none focus:ring-2 focus:ring-gray-300",
          ].join(" ")}
        >
          {move.ctaLabel}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCouldNot}
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline underline-offset-2"
          >
            押せなかった（できなかった）
          </button>

          {showAlternativeButton && (
            <button
              type="button"
              onClick={onSuggestAlternative}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              別の一手を提案する
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

