"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GOAL_COMMIT_POINTS } from "../../_server/goalCommitPoints";

type GoalMap = {
  id: string;
  big_goal: string;
  middle_goal: string;
  small_goal: string;
  big_goal_purpose: string | null;
  middle_goal_purpose: string | null;
  small_goal_purpose: string | null;
  success_criteria: string | null;
  big_goal_due_on: string | null;
  middle_goal_due_on: string | null;
  small_goal_due_on: string | null;
  updated_at: string;
};

type StepDraft = {
  step_kind: "fixed" | "variable";
  title: string;
  sort_order: number;
};

type GoalDraftV2 = {
  version: 2;
  big_goal: string;
  middle_goal: string;
  small_goal: string;
  big_goal_purpose: string | null;
  middle_goal_purpose: string | null;
  small_goal_purpose: string | null;
  success_criteria: string | null;
  big_goal_due_on: string | null;
  middle_goal_due_on: string | null;
  small_goal_due_on: string | null;
  steps: StepDraft[];
  updatedAt: string;
};

function draftStorageKey() {
  return "goalDraft:v2";
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeStepsFromApi(raw: unknown): StepDraft[] {
  if (!Array.isArray(raw)) return [];
  const out: StepDraft[] = [];
  for (let i = 0; i < raw.length; i++) {
    const s = raw[i] as any;
    const kind = s?.step_kind === "fixed" || s?.step_kind === "variable" ? s.step_kind : null;
    const title = typeof s?.title === "string" ? s.title : "";
    if (!kind) continue;
    const so = Number(s?.sort_order);
    out.push({
      step_kind: kind,
      title,
      sort_order: Number.isFinite(so) ? Math.floor(so) : i,
    });
  }
  return out;
}

function stepsSignature(steps: readonly StepDraft[]): string {
  const norm = steps.map((s) => ({
    k: s.step_kind,
    t: s.title.trim(),
    o: s.sort_order,
  }));
  return JSON.stringify(norm);
}

function emptyGoal(): GoalMap {
  return {
    id: "",
    big_goal: "",
    middle_goal: "",
    small_goal: "",
    big_goal_purpose: null,
    middle_goal_purpose: null,
    small_goal_purpose: null,
    success_criteria: null,
    big_goal_due_on: null,
    middle_goal_due_on: null,
    small_goal_due_on: null,
    updated_at: new Date().toISOString(),
  };
}

export function GoalsClient() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);

  const [goal, setGoal] = React.useState<GoalMap | null>(null);
  const [steps, setSteps] = React.useState<StepDraft[]>([]);
  const [lastSavedGoal, setLastSavedGoal] = React.useState<GoalMap | null>(null);
  const [lastSavedStepsSig, setLastSavedStepsSig] = React.useState<string>("[]");
  const [draftRestored, setDraftRestored] = React.useState(false);
  const [showBackConfirm, setShowBackConfirm] = React.useState(false);

  const loadDraft = React.useCallback((): GoalDraftV2 | null => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(draftStorageKey());
    if (!raw) return null;
    const parsed = safeJsonParse<GoalDraftV2>(raw);
    if (!parsed || parsed.version !== 2) return null;
    return parsed;
  }, []);

  const clearDraft = React.useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(draftStorageKey());
  }, []);

  const fetchGoals = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const t = window.setTimeout(() => controller.abort(), 8000);
      const res = await fetch("/api/goals", { signal: controller.signal });
      window.clearTimeout(t);
      const json = (await res.json()) as any;
      if (!json?.ok) throw new Error(json?.error ?? "読み込みに失敗しました");
      const first = (json.goals?.[0] ?? null) as GoalMap | null;
      const baseGoal: GoalMap = first
        ? {
            ...first,
            big_goal_due_on: first.big_goal_due_on ?? null,
            middle_goal_due_on: first.middle_goal_due_on ?? null,
            small_goal_due_on: first.small_goal_due_on ?? null,
          }
        : emptyGoal();

      const serverSteps = normalizeStepsFromApi(json.steps);

      const draft = loadDraft();
      const draftUpdatedAt = draft?.updatedAt
        ? new Date(draft.updatedAt).getTime()
        : 0;
      const baseUpdatedAt = baseGoal.updated_at
        ? new Date(baseGoal.updated_at).getTime()
        : 0;

      const shouldApplyDraft = Boolean(draft) && draftUpdatedAt >= baseUpdatedAt;
      const merged: GoalMap = shouldApplyDraft
        ? {
            ...baseGoal,
            big_goal: String(draft?.big_goal ?? baseGoal.big_goal ?? ""),
            middle_goal: String(draft?.middle_goal ?? baseGoal.middle_goal ?? ""),
            small_goal: String(draft?.small_goal ?? baseGoal.small_goal ?? ""),
            big_goal_purpose: draft?.big_goal_purpose ?? baseGoal.big_goal_purpose,
            middle_goal_purpose:
              draft?.middle_goal_purpose ?? baseGoal.middle_goal_purpose,
            small_goal_purpose:
              draft?.small_goal_purpose ?? baseGoal.small_goal_purpose,
            success_criteria: draft?.success_criteria ?? baseGoal.success_criteria,
            big_goal_due_on: draft?.big_goal_due_on ?? baseGoal.big_goal_due_on,
            middle_goal_due_on:
              draft?.middle_goal_due_on ?? baseGoal.middle_goal_due_on,
            small_goal_due_on:
              draft?.small_goal_due_on ?? baseGoal.small_goal_due_on,
          }
        : baseGoal;

      const mergedSteps = shouldApplyDraft
        ? Array.isArray(draft?.steps) && draft!.steps.length > 0
          ? draft!.steps
          : serverSteps
        : serverSteps;

      setLastSavedGoal(baseGoal);
      setGoal(merged);
      setSteps(mergedSteps);
      setLastSavedStepsSig(stepsSignature(serverSteps));
      setDraftRestored(shouldApplyDraft);
    } catch (e) {
      const msg =
        e instanceof DOMException && e.name === "AbortError"
          ? "読み込みに失敗しました（タイムアウト）"
          : e instanceof Error
            ? e.message
            : "読み込みに失敗しました";
      setError(msg);
      setGoal(null);
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, [loadDraft]);

  React.useEffect(() => {
    void fetchGoals();
  }, [fetchGoals]);

  const update = (patch: Partial<GoalMap>) =>
    setGoal((g) => (g ? { ...g, ...patch } : g));

  const patchStepRow = React.useCallback(
    (idx: number, patch: Partial<Pick<StepDraft, "title" | "step_kind">>) => {
      setSteps((prev) => {
        const next = [...prev];
        const cur = next[idx];
        if (!cur) return prev;
        next[idx] = { ...cur, ...patch };
        return next;
      });
    },
    []
  );

  const removeStepRow = React.useCallback((idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addStepRow = React.useCallback((kind: "fixed" | "variable") => {
    setSteps((prev) => {
      const same = prev.filter((s) => s.step_kind === kind);
      const nextOrder =
        same.length > 0
          ? Math.max(...same.map((s) => s.sort_order)) + 1
          : prev.length;
      return [...prev, { step_kind: kind, title: "", sort_order: nextOrder }];
    });
  }, []);

  const isDirty = React.useMemo(() => {
    if (!goal) return false;
    const sg = goal.small_goal ?? "";
    const sp = goal.small_goal_purpose ?? "";
    const sc = goal.success_criteria ?? "";
    const mg = goal.middle_goal ?? "";
    const mp = goal.middle_goal_purpose ?? "";
    const bg = goal.big_goal ?? "";
    const bp = goal.big_goal_purpose ?? "";
    const bdu = goal.big_goal_due_on ?? null;
    const mdu = goal.middle_goal_due_on ?? null;
    const sdu = goal.small_goal_due_on ?? null;
    const stepSig = stepsSignature(steps);
    if (!lastSavedGoal) {
      return Boolean(
        sg.trim() ||
          sp.trim() ||
          sc.trim() ||
          mg.trim() ||
          mp.trim() ||
          bg.trim() ||
          bp.trim() ||
          bdu ||
          mdu ||
          sdu ||
          stepSig !== "[]"
      );
    }
    const gDirty =
      sg !== (lastSavedGoal.small_goal ?? "") ||
      (sp ?? "") !== (lastSavedGoal.small_goal_purpose ?? "") ||
      (sc ?? "") !== (lastSavedGoal.success_criteria ?? "") ||
      mg !== (lastSavedGoal.middle_goal ?? "") ||
      (mp ?? "") !== (lastSavedGoal.middle_goal_purpose ?? "") ||
      bg !== (lastSavedGoal.big_goal ?? "") ||
      (bp ?? "") !== (lastSavedGoal.big_goal_purpose ?? "") ||
      (bdu ?? null) !== (lastSavedGoal.big_goal_due_on ?? null) ||
      (mdu ?? null) !== (lastSavedGoal.middle_goal_due_on ?? null) ||
      (sdu ?? null) !== (lastSavedGoal.small_goal_due_on ?? null);
    return gDirty || stepSig !== lastSavedStepsSig;
  }, [goal, lastSavedGoal, lastSavedStepsSig, steps]);

  React.useEffect(() => {
    if (!goal) return;
    if (typeof window === "undefined") return;
    const t = window.setTimeout(() => {
      const payload: GoalDraftV2 = {
        version: 2,
        big_goal: goal.big_goal ?? "",
        middle_goal: goal.middle_goal ?? "",
        small_goal: goal.small_goal ?? "",
        big_goal_purpose: goal.big_goal_purpose ?? null,
        middle_goal_purpose: goal.middle_goal_purpose ?? null,
        small_goal_purpose: goal.small_goal_purpose ?? null,
        success_criteria: goal.success_criteria ?? null,
        big_goal_due_on: goal.big_goal_due_on ?? null,
        middle_goal_due_on: goal.middle_goal_due_on ?? null,
        small_goal_due_on: goal.small_goal_due_on ?? null,
        steps,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(draftStorageKey(), JSON.stringify(payload));
    }, 350);
    return () => window.clearTimeout(t);
  }, [goal, steps]);

  const save = async (): Promise<boolean> => {
    if (!goal) return false;
    setSaving(true);
    setError(null);
    setSavedAt(null);
    setSaveMessage(null);
    try {
      const cleanedSteps: StepDraft[] = [];
      for (let i = 0; i < steps.length; i++) {
        const s = steps[i]!;
        const title = String(s.title ?? "").trim().slice(0, 240);
        if (!title) continue;
        cleanedSteps.push({
          step_kind: s.step_kind,
          title,
          sort_order: i,
        });
      }

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
          big_goal_due_on: goal.big_goal_due_on || null,
          middle_goal_due_on: goal.middle_goal_due_on || null,
          small_goal_due_on: goal.small_goal_due_on || null,
          steps: cleanedSteps,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        goal?: GoalMap | null;
        steps?: unknown;
        goal_commit_points?: {
          small: number;
          middle: number;
          big: number;
          total: number;
        };
        points?: number;
      };
      if (!json?.ok) throw new Error(json?.error ?? "保存に失敗しました");
      const savedGoal = (json.goal ?? null) as GoalMap | null;
      if (savedGoal) {
        const withDue: GoalMap = {
          ...savedGoal,
          big_goal_due_on: savedGoal.big_goal_due_on ?? null,
          middle_goal_due_on: savedGoal.middle_goal_due_on ?? null,
          small_goal_due_on: savedGoal.small_goal_due_on ?? null,
        };
        setGoal((prev) => (prev ? { ...prev, ...withDue } : withDue));
        setLastSavedGoal(withDue);
      }
      const savedSteps = normalizeStepsFromApi(json.steps);
      setSteps(savedSteps);
      setLastSavedStepsSig(stepsSignature(savedSteps));
      setSavedAt(new Date().toLocaleString("ja-JP"));
      const gp = json.goal_commit_points;
      if (gp && gp.total > 0) {
        const parts: string[] = [];
        if (gp.small) parts.push(`小ゴール初回 +${gp.small}pt`);
        if (gp.middle) parts.push(`中ゴール初回 +${gp.middle}pt`);
        if (gp.big) parts.push(`大ゴール初回 +${gp.big}pt`);
        const tail =
          typeof json.points === "number" ? ` ・ 現在 ${json.points}pt` : "";
        setSaveMessage(`${parts.join("、")}${tail}`);
      } else {
        setSaveMessage("保存しました");
      }
      clearDraft();
      setDraftRestored(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const dueHint = (
    <>
      <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">
        入力しなくても保存できますが、決められると視界が広がります。
        <span className="block mt-1">
          これは仮の目安です。守れなくても大丈夫。
        </span>
      </p>
    </>
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-3">
        <a
          href="/state-check"
          onClick={(e) => {
            if (!isDirty) return;
            e.preventDefault();
            setShowBackConfirm(true);
          }}
          className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline underline-offset-2"
        >
          ← 診断に戻る
        </a>
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide text-gray-900 mb-3">
        ゴールを作る
      </h1>
      <p className="text-sm text-gray-700 leading-relaxed mb-2">
        ゴールは<strong className="font-semibold">方向性と達成地点</strong>
        。期日は現実とのズレを見るための<strong className="font-semibold">
          仮置き
        </strong>
        です。
      </p>
      <p className="text-sm text-gray-700 leading-relaxed mb-2">
        <strong className="font-semibold">1歩</strong>
        は「今日やる小さな行動」。固定（習慣）と変動（状況に合わせて選ぶ）を小ゴールに紐づけて並べられます。
      </p>
      <p className="text-xs text-gray-500 leading-relaxed mb-6">
        小・中・大ゴールをそれぞれ初めて入力して保存するとポイントが付きます（小 +
        {GOAL_COMMIT_POINTS.small}pt ・中 +{GOAL_COMMIT_POINTS.middle}pt ・大 +
        {GOAL_COMMIT_POINTS.big}pt。再編集では付与されません）。
      </p>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-6 text-sm text-gray-700">
          読み込み中…
        </div>
      ) : (
        <div className="space-y-4">
          {showBackConfirm && isDirty && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-6 text-sm text-amber-900">
              未保存の内容があります。どうしますか？
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await save();
                    if (ok) router.push("/state-check");
                  }}
                  className="rounded-xl bg-gray-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  保存して戻る
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBackConfirm(false);
                    router.push("/state-check");
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  保存せず戻る
                </button>
              </div>
            </div>
          )}

          {draftRestored && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-700">
              下書きを復元しました。
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-6 text-sm text-red-900">
              読み込みまたは保存で問題が発生しました。{` ${error}`}
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void fetchGoals()}
                  className="rounded-xl bg-gray-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  再読み込み
                </button>
                {String(error).toLowerCase().includes("unauthorized") && (
                  <Link
                    href="/login"
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    ログインへ
                  </Link>
                )}
              </div>
            </div>
          )}

          {!goal ? (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6 text-sm text-gray-700">
              準備できていません。「再読み込み」を試してください。
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6 space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  大ゴール
                </h2>
                <input
                  value={goal.big_goal}
                  onChange={(e) => update({ big_goal: e.target.value })}
                  placeholder="人生・事業レベルの方向性（例：自然な自分で生きられる人が増える）"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    期日（任意）
                  </label>
                  <input
                    type="date"
                    value={goal.big_goal_due_on ?? ""}
                    onChange={(e) =>
                      update({
                        big_goal_due_on: e.target.value || null,
                      })
                    }
                    className="w-full sm:w-auto rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  {dueHint}
                </div>
                <textarea
                  value={goal.big_goal_purpose ?? ""}
                  onChange={(e) => update({ big_goal_purpose: e.target.value })}
                  rows={3}
                  placeholder="意味 / 何のためか（任意）"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6 space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  中ゴール
                </h2>
                <input
                  value={goal.middle_goal}
                  onChange={(e) => update({ middle_goal: e.target.value })}
                  placeholder="プロジェクト単位の目標（例：状態診断ツールを育てる）"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    期日（任意）
                  </label>
                  <input
                    type="date"
                    value={goal.middle_goal_due_on ?? ""}
                    onChange={(e) =>
                      update({
                        middle_goal_due_on: e.target.value || null,
                      })
                    }
                    className="w-full sm:w-auto rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  {dueHint}
                </div>
                <textarea
                  value={goal.middle_goal_purpose ?? ""}
                  onChange={(e) =>
                    update({ middle_goal_purpose: e.target.value })
                  }
                  rows={3}
                  placeholder="意味 / 何のためか（任意）"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6 space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  小ゴール
                </h2>
                {!goal.small_goal.trim() && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    具体的な達成地点を1つ決めましょう。
                  </div>
                )}
                <input
                  value={goal.small_goal}
                  onChange={(e) => update({ small_goal: e.target.value })}
                  placeholder="例：履歴の『明日の一手』を1行書く"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    期日（任意）
                  </label>
                  <input
                    type="date"
                    value={goal.small_goal_due_on ?? ""}
                    onChange={(e) =>
                      update({
                        small_goal_due_on: e.target.value || null,
                      })
                    }
                    className="w-full sm:w-auto rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  {dueHint}
                </div>
                <textarea
                  value={goal.small_goal_purpose ?? ""}
                  onChange={(e) => update({ small_goal_purpose: e.target.value })}
                  rows={3}
                  placeholder="意味 / 何のためか（任意）"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6 space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                    ゴールのための1歩
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    固定の1歩は習慣として繰り返し使えます。変動する1歩は、その日の状態や診断から選びやすい候補として並べます。
                  </p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-2">
                    固定の1歩
                  </div>
                  <div className="space-y-2">
                    {steps.map((s, idx) =>
                      s.step_kind !== "fixed" ? null : (
                        <div key={`f-${idx}`} className="flex gap-2 items-start">
                          <input
                            value={s.title}
                            onChange={(e) =>
                              patchStepRow(idx, { title: e.target.value })
                            }
                            placeholder="定番のアクション（例：朝5分だけ机を拭く）"
                            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeStepRow(idx)}
                            className="shrink-0 rounded-lg border border-gray-200 px-2 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            削除
                          </button>
                        </div>
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addStepRow("fixed")}
                    className="mt-2 text-sm font-semibold text-gray-900 underline underline-offset-2"
                  >
                    ＋ 1歩を追加する（固定）
                  </button>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-2">
                    変動する1歩
                  </div>
                  <div className="space-y-2">
                    {steps.map((s, idx) =>
                      s.step_kind !== "variable" ? null : (
                        <div key={`v-${idx}`} className="flex gap-2 items-start">
                          <input
                            value={s.title}
                            onChange={(e) =>
                              patchStepRow(idx, { title: e.target.value })
                            }
                            placeholder="状況に応じて選ぶ候補（例：最優先を1つに絞る）"
                            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeStepRow(idx)}
                            className="shrink-0 rounded-lg border border-gray-200 px-2 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            削除
                          </button>
                        </div>
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addStepRow("variable")}
                    className="mt-2 text-sm font-semibold text-gray-900 underline underline-offset-2"
                  >
                    ＋ 1歩を追加する（変動）
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  達成判定メモ
                </div>
                <textarea
                  value={goal.success_criteria ?? ""}
                  onChange={(e) => update({ success_criteria: e.target.value })}
                  rows={3}
                  placeholder="どうなったら達成と言えるか（任意）"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm sm:text-base bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </section>

              {savedAt && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {(saveMessage ?? "保存しました")}
                  {savedAt ? `（${savedAt}）` : ""}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
