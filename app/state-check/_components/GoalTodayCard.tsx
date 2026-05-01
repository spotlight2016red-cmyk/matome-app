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
  }) => Promise<{ id: string }>;
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
  const [selectedPendingId, setSelectedPendingId] = React.useState<string | null>(null);

  const pendingSorted = React.useMemo(
    () =>
      actions
        .filter((a) => a.status === "pending")
        .slice()
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
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
        if (body.status === "skipped" && selectedPendingId === actionId) {
          setSelectedPendingId(null);
        }
        await onRefresh();
      } finally {
        setBusyId(null);
      }
    },
    [onPatch, onPoints, onRefresh, selectedPendingId]
  );

  const runAdd = React.useCallback(
    async (input: {
      title: string;
      origin: GoalTodayActionOrigin;
      linked_step_id?: string | null;
    }) => {
      setAdding(true);
      try {
        return await onAdd(input);
      } finally {
        setAdding(false);
      }
    },
    [onAdd, onRefresh]
  );

  React.useEffect(() => {
    if (pendingSorted.length === 0) {
      setSelectedPendingId(null);
      return;
    }
    setSelectedPendingId((prev) => {
      const stillPending = pendingSorted.some((p) => p.id === prev);
      if (prev && stillPending) return prev;
      // 保留中が複数ある場合は選び直させる（自動で先頭だけにフォーカスすると「複数の完了」が出る）
      if (pendingSorted.length > 1) return null;
      return pendingSorted[0]?.id ?? null;
    });
  }, [pendingSorted]);

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
        <div className="text-xs text-gray-500 mb-1">今日の1歩を選ぶ</div>
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
  const selectedPending =
    pendingSorted.find((a) => a.id === selectedPendingId) ??
    null;

  const choose = async (input: {
    title: string;
    origin: GoalTodayActionOrigin;
    linked_step_id?: string | null;
  }) => {
    const currentId = selectedPendingId;
    if (currentId) await runPatch(currentId, { status: "skipped" });

    let createdId: string;
    try {
      const created = await runAdd(input);
      createdId = created.id;
    } catch {
      return;
    }
    await onRefresh();
    setSelectedPendingId(createdId);
  };

  const candidates: Array<{
    key: string;
    title: string;
    origin: GoalTodayActionOrigin;
    linked_step_id?: string | null;
    label?: string;
  }> = [];
  if (sug) {
    candidates.push({
      key: `diag:${sug}`,
      title: sug,
      origin: "diagnosis",
      linked_step_id: null,
      label: "診断の提案",
    });
  }
  for (const s of fixedSteps) {
    candidates.push({
      key: `fixed:${s.id}`,
      title: s.title,
      origin: "fixed_pick",
      linked_step_id: s.id,
      label: "固定の1歩",
    });
  }
  for (const s of variableSteps) {
    candidates.push({
      key: `var:${s.id}`,
      title: s.title,
      origin: "variable_pick",
      linked_step_id: s.id,
      label: "変動する1歩",
    });
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6 space-y-5">
      <div>
        <div className="text-xs text-gray-500 mb-1">今日の1歩を選ぶ</div>
        <p className="text-sm text-gray-800 leading-relaxed">
          小ゴール<strong className="font-semibold">「{smallGoalTitle.trim()}」</strong>
          に向けて、候補の中から<strong className="font-semibold">今日の1歩</strong>
          を1つ選んでください。
        </p>
        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 leading-relaxed">
          <div>この中から、今日やる1歩を1つ選んでください。</div>
          <div className="text-gray-600">迷ったら、いちばん軽いものからでOKです。</div>
        </div>
      </div>

      <div className="space-y-3">
        {candidates.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-700">
            まず「ゴール・1歩のプールを編集」で候補を追加すると、ここから選べるようになります。
          </div>
        ) : (
          <div className="space-y-2">
            {candidates.map((c) => (
              <div
                key={c.key}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  {c.label ? (
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">
                      {c.label}
                    </div>
                  ) : null}
                  <div className="text-sm font-semibold text-gray-900 leading-relaxed break-words">
                    {c.title}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={adding}
                  onClick={() =>
                    void choose({
                      title: c.title,
                      origin: c.origin,
                      linked_step_id: c.linked_step_id ?? null,
                    })
                  }
                  className={[
                    "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold",
                    adding
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-900 text-white hover:bg-gray-800",
                  ].join(" ")}
                >
                  {c.origin === "diagnosis" ? "これを選ぶ" : "選ぶ"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
              void (async () => {
                const t = manualTitle.trim().slice(0, 240);
                if (!t) return;
                await choose({
                  title: t,
                  origin: "manual",
                  linked_step_id: null,
                });
                setManualTitle("");
              })()
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
        <p className="text-[11px] text-gray-500 leading-relaxed">
          「追加」を押すと、いま入力した内容が
          <strong className="font-semibold"> 今日の1歩 </strong>
          として「いま取り組む」にセットされます（必要なら下で選び直せます）。
        </p>
      </div>

      {selectedPending ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-600">いま取り組む</div>
          <TodayActionRow
            key={selectedPending.id}
            action={selectedPending}
            busy={busyId === selectedPending.id}
            onComplete={() => void runPatch(selectedPending.id, { status: "completed" })}
            onSkip={() => void runPatch(selectedPending.id, { status: "skipped" })}
            onReselect={() => void runPatch(selectedPending.id, { status: "skipped" })}
          />
        </div>
      ) : null}

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
  onReselect,
}: {
  action: GoalTodayActionRow;
  busy: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onReselect?: () => void;
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
      {onReselect && (
        <button
          type="button"
          disabled={busy}
          onClick={onReselect}
          className="text-sm font-semibold text-gray-700 underline underline-offset-2 hover:text-gray-900"
        >
          選び直す
        </button>
      )}
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
