"use client";

import * as React from "react";
import Link from "next/link";

type GoalMap = {
  id: string;
  big_goal: string;
  middle_goal: string;
  small_goal: string;
  big_goal_purpose: string | null;
  middle_goal_purpose: string | null;
  small_goal_purpose: string | null;
  success_criteria: string | null;
  updated_at: string;
};

export function GoalsClient() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  const [goal, setGoal] = React.useState<GoalMap | null>(null);

  const fetchGoals = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goals");
      const json = (await res.json()) as any;
      if (!json?.ok) throw new Error(json?.error ?? "取得に失敗しました");
      const first = (json.goals?.[0] ?? null) as GoalMap | null;
      setGoal(
        first ?? {
          id: "",
          big_goal: "",
          middle_goal: "",
          small_goal: "",
          big_goal_purpose: null,
          middle_goal_purpose: null,
          small_goal_purpose: null,
          success_criteria: null,
          updated_at: new Date().toISOString(),
        }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchGoals();
  }, [fetchGoals]);

  const update = (patch: Partial<GoalMap>) =>
    setGoal((g) => (g ? { ...g, ...patch } : g));

  const save = async () => {
    if (!goal) return;
    setSaving(true);
    setError(null);
    setSavedAt(null);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: goal.id || undefined,
          big_goal: goal.big_goal,
          middle_goal: goal.middle_goal,
          small_goal: goal.small_goal,
          big_goal_purpose: goal.big_goal_purpose,
          middle_goal_purpose: goal.middle_goal_purpose,
          small_goal_purpose: goal.small_goal_purpose,
          success_criteria: goal.success_criteria,
        }),
      });
      const json = (await res.json()) as any;
      if (!json?.ok) throw new Error(json?.error ?? "保存に失敗しました");
      setGoal((prev) => (prev ? { ...prev, ...json.goal } : json.goal));
      setSavedAt(new Date().toLocaleString("ja-JP"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/state-check"
          className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline underline-offset-2"
        >
          ← 診断に戻る
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide text-gray-900 mb-3">
        ゴール整理
      </h1>
      <p className="text-sm text-gray-700 leading-relaxed mb-6">
        大ゴール / 中ゴール / 小ゴールをつなげて、意味も一緒に保存します。
      </p>

      {loading || !goal ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-6 text-sm text-gray-700">
          読み込み中…
        </div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
            <div className="text-xs text-gray-500 mb-1">大ゴール</div>
            <input
              value={goal.big_goal}
              onChange={(e) => update({ big_goal: e.target.value })}
              placeholder="例：自然な自分で生きられる人が増える"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <textarea
              value={goal.big_goal_purpose ?? ""}
              onChange={(e) => update({ big_goal_purpose: e.target.value })}
              rows={3}
              placeholder="意味 / 何のためか（任意）"
              className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
            <div className="text-xs text-gray-500 mb-1">中ゴール</div>
            <input
              value={goal.middle_goal}
              onChange={(e) => update({ middle_goal: e.target.value })}
              placeholder="例：状態診断ツールを育てる"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <textarea
              value={goal.middle_goal_purpose ?? ""}
              onChange={(e) => update({ middle_goal_purpose: e.target.value })}
              rows={3}
              placeholder="意味 / 何のためか（任意）"
              className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
            <div className="text-xs text-gray-500 mb-1">小ゴール</div>
            <input
              value={goal.small_goal}
              onChange={(e) => update({ small_goal: e.target.value })}
              placeholder="例：今週は履歴・傾向が見えるところまで"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <textarea
              value={goal.small_goal_purpose ?? ""}
              onChange={(e) => update({ small_goal_purpose: e.target.value })}
              rows={3}
              placeholder="意味 / 何のためか（任意）"
              className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </section>

          <section className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-6">
            <div className="text-xs text-gray-500 mb-1">達成判定メモ</div>
            <textarea
              value={goal.success_criteria ?? ""}
              onChange={(e) => update({ success_criteria: e.target.value })}
              rows={3}
              placeholder="どうなったら達成と言えるか（任意）"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {savedAt && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              保存しました（{savedAt}）
            </div>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={[
              "w-full rounded-2xl px-4 py-4 text-sm sm:text-base font-semibold",
              "focus:outline-none focus:ring-2 focus:ring-gray-300",
              saving
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-800",
            ].join(" ")}
          >
            {saving ? "保存中…" : "保存する"}
          </button>
        </div>
      )}
    </div>
  );
}

