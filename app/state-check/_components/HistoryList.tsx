"use client";

import * as React from "react";
import Link from "next/link";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function memoSnippet(memo: string) {
  const s = memo.trim().replace(/\s+/g, " ");
  if (!s) return "（メモなし）";
  return s.length > 44 ? `${s.slice(0, 44)}…` : s;
}

export type DiagnosisRunSummary = {
  id: string;
  created_at: string;
  day_key?: string;
  run_kind?: string;
  result_type: string;
  note_text: string | null;
  propulsion_score: number;
  fatigue_score: number;
  confusion_score: number;
  recovery_score: number;
  heat_score: number;
};

export function HistoryList({ history }: { history: DiagnosisRunSummary[] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">過去の診断履歴</div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            見返し
          </h3>
        </div>
        <Link
          href="/state-check/history"
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 underline underline-offset-2"
        >
          履歴ページへ
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="text-sm text-gray-600">
          まだ履歴はありません。診断結果を保存すると、ここにたまっていきます。
        </div>
      ) : (
        <div className="space-y-3">
          {history.slice(0, 12).map((h) => (
            <div
              key={h.id}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-gray-900">
                  {h.result_type}
                </div>
                <div className="text-[11px] text-gray-500">
                  {formatDate(h.created_at)}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
                <span>推進 {h.propulsion_score}</span>
                <span>消耗 {h.fatigue_score}</span>
                <span>迷い {h.confusion_score}</span>
                <span>回復 {h.recovery_score}</span>
                <span>熱量 {h.heat_score}</span>
              </div>
              <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                {memoSnippet(h.note_text ?? "")}
              </div>
              <div className="mt-2">
                <Link
                  href={`/state-check/history/${h.id}`}
                  className="text-xs font-semibold text-gray-700 hover:text-gray-900 underline underline-offset-2"
                >
                  詳細を見る
                </Link>
              </div>
            </div>
          ))}
          {history.length > 12 && (
            <div className="text-xs text-gray-500">
              直近 12 件を表示中（初期版）
            </div>
          )}
        </div>
      )}
    </section>
  );
}

