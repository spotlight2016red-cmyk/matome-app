"use client";

import * as React from "react";

export function TrendsPanel({
  recentTendencies,
  recoveryStyles,
}: {
  recentTendencies: string[];
  recoveryStyles: string[];
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
      <div className="text-xs text-gray-500 mb-1">最近の傾向</div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
        “育つ診断”のサマリー
      </h3>

      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
          <div className="text-xs font-semibold text-gray-600 mb-2">
            どういう時に崩れやすいか
          </div>
          {recentTendencies.length === 0 ? (
            <div className="text-sm text-gray-600">
              まだ傾向を出すには履歴が少ないです（2回以上の共通点から表示します）。
            </div>
          ) : (
            <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base text-gray-900">
              {recentTendencies.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
          <div className="text-xs font-semibold text-gray-600 mb-2">
            自分に合う戻し方
          </div>
          {recoveryStyles.length === 0 ? (
            <div className="text-sm text-gray-600">
              まだ表示はありません。診断を数回保存すると、よく効く戻し方が出てきます。
            </div>
          ) : (
            <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base text-gray-900">
              {recoveryStyles.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

