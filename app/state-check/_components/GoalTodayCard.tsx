"use client";

import * as React from "react";
import Link from "next/link";
import type {
  GoalTodayActionRow,
  GoalTodayActionOrigin,
  GoalStepRow,
} from "../_server/types";

type PatchBody = {
  status?: "pending" | "completed" | "skipped";
  completion_note?: string | null;
};

export function GoalTodayCard({
  authed,
  smallGoalTitle,
  fixedSteps,
  variableSteps,
  actions,
  diagnosisSuggestion,
  loading,
  scrollToInsight,
  onRefresh,
  onAdd,
  onPatch,
  onPoints,
}: {
  authed: boolean;
  smallGoalTitle: string | null;
  fixedSteps: GoalStepRow[];
  variableSteps: GoalStepRow[];
  actions: GoalTodayActionRow[];
  diagnosisSuggestion: string;
  loading?: boolean;
  scrollToInsight: () => void;
  onRefresh: () => Promise<void>;
  onAdd: (input: {
    title: string;
    origin: GoalTodayActionOrigin;
    linked_step_id?: string | null;
  }) => Promise<void>;
  onPatch: (
    actionId: string,
    body: PatchBody
  ) => Promise<{ points_delta?: number; points?: number } | void>;
  onPoints?: (payload: { delta: number; points?: number }) => void;
}) {
  const [manualTitle, setManualTitle] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [afterCompleteActionId, setAfterCompleteActionId] = React.useState<string | null>(null);

  const pending = React.useMemo(
    () => actions.filter((a) => a.status === "pending"),
    [actions]
  );
  const completed = React.useMemo(
    () => actions.filter((a) => a.status === "completed"),
    [actions]
  );
  const skipped = React.useMemo(
    () => actions.filter((a) => a.status === "skipped"),
    [actions]
  );

  const runPatch = React.useCallback(
    async (actionId: string, body: PatchBody) => {
      setBusyId(actionId);
      try {
        const res = await onPatch(actionId, body);
        if (res && typeof res.points_delta === "number" && res.points_delta > 0) {
          onPoints?.({ delta: res.points_delta, points: res.points });
        }
        if (body.status === "completed") {
          setAfterCompleteActionId(actionId);
        }
        await onRefresh();
      } finally {
        setBusyId(null);
      }
    },
    [onPatch, onPoints, onRefresh]
  );

  const runAdd = React.useCallback(
    async (input: {
      title: string;
      origin: GoalTodayActionOrigin;
      linked_step_id?: string | null;
    }) => {
      setAdding(true);
      try {
        await onAdd(input);
        setManualTitle("");
        await onRefresh();
      } finally {
        setAdding(false);
      }
    },
    [onAdd, onRefresh]
  );

  if (!authed) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-6 text-sm text-gray-700">
        ログインすると、選択中ゴールに紐づく<strong className="font-semibold"> 今日の1歩 </strong>
        を追加・完了でき、ポイントも付きます。
      </section>
    );
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6 text-sm text-gray-600">
        読み込み中…
      </section>
    );
  }

  if (!smallGoalTitle?.trim()) {
    return (
      <section className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-6">
        <div className="text-xs text-gray-500 mb-1">今日の1歩</div>
        <p className="text-sm text-gray-800 leading-relaxed">
          先にゴール（小ゴールまで）を決めると、その方向に対する<strong className="font-semibold">今日の1歩</strong>をここに並べられます。
        </p>
        <Link
          href="/state-check/goals"
          className="mt-4 inline-flex items-center justify-center rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          ゴールを作る
        </Link>
      </section>
    );
  }

  const sug = diagnosisSuggestion.trim();

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6 space-y-5">
      <div>
        <div className="text-xs text-gray-500 mb-1">今日の1歩</div>
        <p className="text-sm text-gray-800 leading-relaxed">
          小ゴール<strong className="font-semibold">「{smallGoalTitle.trim()}」</strong>に向けて、今日やる小さな行動を並べます（複数OK）。
        </p>
      </div>

      {sug ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-4 space-y-2">
          <div className="text-xs font-semibold text-sky-900">診断の提案（参考）</div>
          <p className="text-sm text-gray-900 leading-relaxed">{sug}</p>
          <button
            type="button"
            disabled={adding || !sug}
            onClick={() =>
              void runAdd({ title: sug, origin: "diagnosis", linked_step_id: null })
            }
            className={[
              "text-sm font-semibold underline underline-offset-2",
              adding ? "text-gray-400 cursor-not-allowed" : "text-sky-900 hover:text-sky-950",
            ].join(" ")}
          >
            今日の1歩に追加する
          </button>
        </div>
      ) : null}

      {fixedSteps.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-2">固定の1歩（習慣）</div>
          <div className="flex flex-wrap gap-2">
            {fixedSteps.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={adding}
                onClick={() =>
                  void runAdd({
                    title: s.title,
                    origin: "fixed_pick",
                    linked_step_id: s.id,
                  })
                }
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-50"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {variableSteps.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-2">変動する1歩（プール）</div>
          <div className="flex flex-wrap gap-2">
            {variableSteps.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={adding}
                onClick={() =>
                  void runAdd({
                    title: s.title,
                    origin: "variable_pick",
                    linked_step_id: s.id,
                  })
                }
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-600">＋ 1歩を追加する</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="いま思いついた行動を一行で"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <button
            type="button"
            disabled={adding || !manualTitle.trim()}
            onClick={() =>
              void runAdd({
                title: manualTitle.trim(),
                origin: "manual",
                linked_step_id: null,
              })
            }
            className={[
              "rounded-xl px-4 py-3 text-sm font-semibold whitespace-nowrap",
              adding || !manualTitle.trim()
                ? "bg-gray-100 text-gray-400"
                : "bg-gray-900 text-white hover:bg-gray-800",
            ].join(" ")}
          >
            追加
          </button>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-600">いま取り組む</div>
          {pending.map((a) => (
            <TodayActionRow
              key={a.id}
              action={a}
              busy={busyId === a.id}
              onComplete={() => void runPatch(a.id, { status: "completed" })}
              onSkip={() => void runPatch(a.id, { status: "skipped" })}
            />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-emerald-800">完了</div>
          {completed.map((a) => (
            <CompletedRow
              key={a.id}
              action={a}
              busy={busyId === a.id}
              showAfterComplete={afterCompleteActionId === a.id}
              onAfterCompleteChoice={(choice) => {
                if (choice === "memo") scrollToInsight();
                setAfterCompleteActionId(null);
              }}
              onSaveNote={(note) => runPatch(a.id, { completion_note: note })}
            />
          ))}
        </div>
      )}

      {skipped.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500">今日はできなかった</div>
          <ul className="text-sm text-gray-600 space-y-1">
            {skipped.map((a) => (
              <li key={a.id} className="line-through opacity-80">
                {a.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-1">
        <Link
          href="/state-check/goals"
          className="text-sm font-semibold text-gray-700 underline underline-offset-2 hover:text-gray-900"
        >
          ゴール・1歩のプールを編集
        </Link>
      </div>
    </section>
  );
}

function TodayActionRow({
  action,
  busy,
  onComplete,
  onSkip,
}: {
  action: GoalTodayActionRow;
  busy: boolean;
  onComplete: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-4 space-y-3">
      <div className="text-sm sm:text-base font-semibold text-gray-900 leading-snug">
        {action.title}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onComplete}
          className={[
            "flex-1 rounded-xl px-4 py-3 text-sm font-semibold",
            busy
              ? "bg-gray-100 text-gray-400"
              : "bg-gray-900 text-white hover:bg-gray-800",
          ].join(" ")}
        >
          {busy ? "処理中…" : "この1歩を完了する"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onSkip}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          今日はできなかった
        </button>
      </div>
    </div>
  );
}

function CompletedRow({
  action,
  busy,
  showAfterComplete,
  onAfterCompleteChoice,
  onSaveNote,
}: {
  action: GoalTodayActionRow;
  busy: boolean;
  showAfterComplete: boolean;
  onAfterCompleteChoice: (choice: "memo" | "skip") => void;
  onSaveNote: (note: string | null) => void | Promise<void>;
}) {
  const [local, setLocal] = React.useState(action.completion_note ?? "");
  React.useEffect(() => {
    setLocal(action.completion_note ?? "");
  }, [action.completion_note, action.id]);

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 space-y-2">
      <div className="text-sm font-semibold text-gray-900">{action.title}</div>
      {showAfterComplete && (
        <div
          className="rounded-xl border border-emerald-200 bg-white/80 px-3 py-3 text-sm text-emerald-950 space-y-2"
          role="status"
          aria-live="polite"
        >
          <div className="font-semibold">できた！</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onAfterCompleteChoice("memo")}
              className="rounded-xl bg-gray-900 text-white px-4 py-3 text-sm font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              ひとこと記録する（+10pt）
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onAfterCompleteChoice("skip")}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              今はしない
            </button>
          </div>
        </div>
      )}
      <label className="block text-xs text-gray-600">気づき・メモ（任意）</label>
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        rows={2}
        disabled={busy}
        placeholder="一行でも残せます"
        className="w-full rounded-lg border border-emerald-200/80 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => void onSaveNote(local.trim() ? local.trim() : null)}
        className="text-xs font-semibold text-emerald-900 underline underline-offset-2"
      >
        メモを保存
      </button>
    </div>
  );
}
