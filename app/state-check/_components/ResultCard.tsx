"use client";

import * as React from "react";
import type { StateCheckComputation } from "../_lib/logic";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
      {children}
    </span>
  );
}

export function ResultCard({
  computation,
  onReset,
}: {
  computation: StateCheckComputation;
  onReset: () => void;
}) {
  const { result, scores, heatMode } = computation;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">診断結果</div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-wide text-gray-900">
            {result.name}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>推進力 {scores.propulsion}</Badge>
          <Badge>消耗度 {scores.exhaustion}</Badge>
          <Badge>迷い度 {scores.confusion}</Badge>
          <Badge>回復必要度 {scores.recoveryNeed}</Badge>
          <Badge>熱量 {scores.heat}</Badge>
        </div>
      </div>

      <div className="space-y-5">
        {heatMode && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="text-xs font-semibold text-amber-800 mb-1">
              {heatMode.title}
            </div>
            <div className="text-sm sm:text-base text-gray-900 leading-relaxed mb-3">
              {heatMode.body}
            </div>
            <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base text-gray-900">
              {heatMode.actions.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4">
          <div className="text-xs font-semibold text-gray-600 mb-1">
            今の状態の説明
          </div>
          <div className="text-sm sm:text-base text-gray-900 leading-relaxed">
            {result.description}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4">
          <div className="text-xs font-semibold text-gray-600 mb-1">
            今の方程式
          </div>
          <div className="text-sm sm:text-base text-gray-900 leading-relaxed">
            {result.formula}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4">
          <div className="text-xs font-semibold text-gray-600 mb-2">
            このまま行くと起こりやすいこと
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base text-gray-900">
            {result.likely.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-gray-900 text-white px-4 py-4">
          <div className="text-xs font-semibold text-white/80 mb-1">
            修正するための1手
          </div>
          <div className="text-sm sm:text-base leading-relaxed">{result.nextStep}</div>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4">
          <div className="text-xs font-semibold text-gray-600 mb-2">
            早めに戻す具体行動
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base text-gray-900">
            {result.quickActions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm sm:text-base font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          もう一度診断する
        </button>
      </div>
    </section>
  );
}

