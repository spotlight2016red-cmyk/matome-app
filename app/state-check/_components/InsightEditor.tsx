"use client";

import * as React from "react";

export function InsightEditor({
  value,
  onChange,
  onSave,
  disabled,
  pointsHint,
}: {
  value: string;
  onChange: (next: string) => void;
  onSave: () => void;
  disabled?: boolean;
  pointsHint?: string;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">今回の気づき・追加情報</div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            あとから育つ診断にするためのメモ
          </h3>
        </div>
        <div className="text-[11px] text-gray-500 shrink-0">
          アカウントに保存
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed mb-3">
        例：しっくりきた点／実際に起きた失敗／最近の違和感／戻りやすかったこと／次回覚えておきたいこと
      </p>

      <textarea
        id="state-check-insight-note"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="ここに自由に書いてOK（箇条書きでも）"
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm sm:text-base text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-gray-300"
      />

      <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500">
          「診断履歴」に一緒に保存されます。
        </div>
        {pointsHint && (
          <div className="text-xs text-gray-500">
            {pointsHint}
          </div>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={disabled}
          className={[
            "rounded-xl px-4 py-3 text-sm sm:text-base font-semibold",
            "focus:outline-none focus:ring-2 focus:ring-gray-300",
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-800",
          ].join(" ")}
        >
          記録する
        </button>
      </div>
    </section>
  );
}

