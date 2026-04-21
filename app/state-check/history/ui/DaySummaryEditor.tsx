"use client";

import * as React from "react";

export function DaySummaryEditor({
  dayKey,
  initial,
}: {
  dayKey: string;
  initial?: {
    drift_text: string | null;
    recovered_text: string | null;
    tomorrow_step_text: string | null;
  };
}) {
  const [drift, setDrift] = React.useState(initial?.drift_text ?? "");
  const [recovered, setRecovered] = React.useState(initial?.recovered_text ?? "");
  const [tomorrow, setTomorrow] = React.useState(initial?.tomorrow_step_text ?? "");
  const [state, setState] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const save = async () => {
    setState("saving");
    try {
      const res = await fetch("/api/day-summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_key: dayKey,
          drift_text: drift,
          recovered_text: recovered,
          tomorrow_step_text: tomorrow,
        }),
      });
      const json = (await res.json()) as any;
      if (!json?.ok) throw new Error(json?.error ?? "保存に失敗しました");
      setState("saved");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("error");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
      <div className="text-xs text-gray-500 mb-1">この日のまとめ</div>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">
            今日ズレたこと
          </div>
          <textarea
            value={drift}
            onChange={(e) => setDrift(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">
            なんで戻れたか
          </div>
          <textarea
            value={recovered}
            onChange={(e) => setRecovered(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">
            明日の一手
          </div>
          <textarea
            value={tomorrow}
            onChange={(e) => setTomorrow(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          {state === "saving" && "保存中…"}
          {state === "saved" && "保存しました"}
          {state === "error" && "保存に失敗しました"}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={state === "saving"}
          className="rounded-xl bg-gray-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
        >
          保存
        </button>
      </div>
    </div>
  );
}

