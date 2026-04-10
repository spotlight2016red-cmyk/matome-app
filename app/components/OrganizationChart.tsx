"use client";

import React from "react";

function FlowArrow() {
  return (
    <svg
      width={80}
      height={80}
      viewBox="0 0 24 24"
      className="-rotate-90 text-gray-400"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"
      />
    </svg>
  );
}

const defaultMemoItems = ["メモ項目1", "メモ項目2", "メモ項目3"];

type PriorityTaskItem = { task: string; time: string; done: boolean };

/** 司令本部「映画広報」下 — 映画『残すということ』用タスク */
type KohoTaskItem = { id: string; content: string; due: string; done: boolean };

const KAIRO_KOHO_TASKS_STORAGE_KEY = "kairoNokotoniKohoTasks";

function newKohoTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function normalizeKohoTask(row: unknown): KohoTaskItem | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  return {
    id: String(r.id ?? newKohoTaskId()),
    content: String(r.content ?? ""),
    due: String(r.due ?? ""),
    done: Boolean(r.done),
  };
}

const defaultPriorityTasks: PriorityTaskItem[] = [
  { task: "最優先タスク1", time: "10:00", done: false },
  { task: "最優先タスク2", time: "14:00", done: false },
  { task: "最優先タスク3", time: "16:30", done: false },
];
const defaultDailyTasks = ["毎日タスク1", "毎日タスク2", "毎日タスク3"];

/** 司令本部：最上位の統括リンク（href は共有URL。別URLにしたい場合は右クリックで変更） */
const shireibuTopLink = {
  label: "司令部映画統括",
  href: "https://chatgpt.com/g/g-p-691ecfa61b688191aff053276412376b-esientomoto/c/69cf0247-24a8-83aa-8d84-2762c83d6a7c",
} as const;

/** 司令本部：分野ごとの ChatGPT リンク（別URLにしたい項目だけ href を差し替え） */
const shireibuLinks = [
  {
    label: "映画編集",
    href: "https://chatgpt.com/share/69d83c56-74fc-83a4-a5e4-7cfa6c9e6047",
  },
  {
    label: "映画広報",
    href: "https://chatgpt.com/g/g-p-691ecfa61b688191aff053276412376b-esientomoto/c/69cf0247-24a8-83aa-8d84-2762c83d6a7c",
  },
  {
    label: "映画撮影",
    href: "https://chatgpt.com/g/g-p-691ecfa61b688191aff053276412376b-esientomoto/c/69cf0247-24a8-83aa-8d84-2762c83d6a7c",
  },
  {
    label: "映画上映",
    href: "https://chatgpt.com/g/g-p-691ecfa61b688191aff053276412376b-esientomoto/c/69cf0247-24a8-83aa-8d84-2762c83d6a7c",
  },
] as const;

const SHIREIBU_DEFAULT_HREFS: Record<string, string> = Object.fromEntries([
  [shireibuTopLink.label, shireibuTopLink.href],
  ...shireibuLinks.map((l) => [l.label, l.href] as const),
]);

function isValidHttpUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function OrganizationChart() {
  const [isKairoExpanded, setIsKairoExpanded] = React.useState(false);
  const [isShikinExpanded, setIsShikinExpanded] = React.useState(false);
  const [isEditingMemo, setIsEditingMemo] = React.useState(false);
  
  const [memoItems, setMemoItems] =
    React.useState<string[]>(defaultMemoItems);
  const [newMemo, setNewMemo] = React.useState('');
  
  const [isEditingPriority, setIsEditingPriority] = React.useState(false);
  const [priorityTasks, setPriorityTasks] =
    React.useState<PriorityTaskItem[]>(defaultPriorityTasks);
  const [newPriority, setNewPriority] = React.useState('');
  const [newPriorityTime, setNewPriorityTime] = React.useState('');
  const [editingTimeIndex, setEditingTimeIndex] = React.useState<number | null>(null);
  const [editingTaskIndex, setEditingTaskIndex] = React.useState<number | null>(null);
  const [taskInputValue, setTaskInputValue] = React.useState('');

  // 過去のタスク名を保存（候補用）
  const [taskHistory, setTaskHistory] = React.useState<string[]>([]);

  // 時間候補リスト
  const timeOptions = [
    '6:00', '6:30', '7:00', '7:30', '8:00', '8:30', '9:00', '9:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00', '22:30', '23:00', '23:30',
  ];

  const [isEditingDaily, setIsEditingDaily] = React.useState(false);
  const [dailyTasks, setDailyTasks] =
    React.useState<string[]>(defaultDailyTasks);
  const [newDaily, setNewDaily] = React.useState("");

  const [shireibuOverrides, setShireibuOverrides] = React.useState<
    Record<string, string>
  >({});
  const [shireibuLinkMenu, setShireibuLinkMenu] = React.useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);

  const [kohoTasks, setKohoTasks] = React.useState<KohoTaskItem[]>([]);
  const [newKohoContent, setNewKohoContent] = React.useState("");
  const [newKohoDue, setNewKohoDue] = React.useState("");

  const shireibuHref = React.useCallback(
    (label: string) => shireibuOverrides[label] ?? SHIREIBU_DEFAULT_HREFS[label] ?? "#",
    [shireibuOverrides]
  );

  const [storageReady, setStorageReady] = React.useState(false);

  // 描画前に読み込み、デフォルト表示のフラッシュと「勝手に戻った」ように見える挙動を抑える
  React.useLayoutEffect(() => {
    try {
      const m = localStorage.getItem("memoItems");
      if (m) setMemoItems(JSON.parse(m));
      const p = localStorage.getItem("priorityTasks");
      if (p) {
        const parsed: unknown = JSON.parse(p);
        if (Array.isArray(parsed)) {
          setPriorityTasks(
            parsed.map((row: unknown) => {
              const t = row as { task?: string; time?: string; done?: boolean };
              return {
                task: String(t?.task ?? ""),
                time: String(t?.time ?? ""),
                done: Boolean(t?.done),
              };
            })
          );
        }
      }
      const d = localStorage.getItem("dailyTasks");
      if (d) setDailyTasks(JSON.parse(d));
      const t = localStorage.getItem("taskHistory");
      if (t) setTaskHistory(JSON.parse(t));
      const so = localStorage.getItem("shireibuLinkOverrides");
      if (so) {
        const parsed: unknown = JSON.parse(so);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setShireibuOverrides(parsed as Record<string, string>);
        }
      }
      const koh = localStorage.getItem(KAIRO_KOHO_TASKS_STORAGE_KEY);
      if (koh) {
        const parsed: unknown = JSON.parse(koh);
        if (Array.isArray(parsed)) {
          const items = parsed
            .map(normalizeKohoTask)
            .filter((x): x is KohoTaskItem => x !== null);
          setKohoTasks(items);
        }
      }
    } catch {
      /* ignore invalid JSON */
    } finally {
      setStorageReady(true);
    }
  }, []);

  // localStorage に保存（hydrate 完了後のみ。初回でデフォルトを上書きしない）
  React.useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("memoItems", JSON.stringify(memoItems));
  }, [memoItems, storageReady]);

  React.useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("priorityTasks", JSON.stringify(priorityTasks));
  }, [priorityTasks, storageReady]);

  React.useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("dailyTasks", JSON.stringify(dailyTasks));
  }, [dailyTasks, storageReady]);

  React.useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("taskHistory", JSON.stringify(taskHistory));
  }, [taskHistory, storageReady]);

  React.useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(
      "shireibuLinkOverrides",
      JSON.stringify(shireibuOverrides)
    );
  }, [shireibuOverrides, storageReady]);

  React.useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(
      KAIRO_KOHO_TASKS_STORAGE_KEY,
      JSON.stringify(kohoTasks)
    );
  }, [kohoTasks, storageReady]);

  React.useEffect(() => {
    if (!shireibuLinkMenu) return;
    const close = () => setShireibuLinkMenu(null);
    const t = window.setTimeout(() => {
      window.addEventListener("click", close);
      window.addEventListener("scroll", close, true);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [shireibuLinkMenu]);

  const handleAddMemo = () => {
    if (newMemo.trim()) {
      setMemoItems([...memoItems, newMemo.trim()]);
      setNewMemo('');
    }
  };

  const handleDeleteMemo = (index: number) => {
    setMemoItems(memoItems.filter((_, i) => i !== index));
  };

  const handleUpdateMemo = (index: number, value: string) => {
    const updated = [...memoItems];
    updated[index] = value;
    setMemoItems(updated);
  };

  const handleAddPriority = () => {
    if (newPriority.trim() && newPriorityTime.trim()) {
      setPriorityTasks([
        ...priorityTasks,
        { task: newPriority.trim(), time: newPriorityTime.trim(), done: false },
      ]);
      setNewPriority('');
      setNewPriorityTime('');
    }
  };

  const handleDeletePriority = (index: number) => {
    setPriorityTasks(priorityTasks.filter((_, i) => i !== index));
  };

  const handleUpdatePriority = (index: number, value: string, time: string) => {
    const updated = [...priorityTasks];
    const prev = updated[index];
    updated[index] = {
      task: value,
      time: time,
      done: prev?.done ?? false,
    };
    setPriorityTasks(updated);
    
    // タスク名を履歴に追加（重複は避け��）
    if (value.trim() && !taskHistory.includes(value.trim())) {
      setTaskHistory([...taskHistory, value.trim()]);
    }
  };

  const handleTogglePriorityDone = (index: number) => {
    setPriorityTasks(
      priorityTasks.map((t, i) =>
        i === index ? { ...t, done: !t.done } : t
      )
    );
  };

  const handleAddDaily = () => {
    if (newDaily.trim()) {
      setDailyTasks([...dailyTasks, newDaily.trim()]);
      setNewDaily('');
    }
  };

  const handleDeleteDaily = (index: number) => {
    setDailyTasks(dailyTasks.filter((_, i) => i !== index));
  };

  const handleUpdateDaily = (index: number, value: string) => {
    const updated = [...dailyTasks];
    updated[index] = value;
    setDailyTasks(updated);
  };

  const handleResetPriorityToDefaults = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm(
        "今日の最優先を初期の3件に戻しますか？\n今の一覧は破棄され、ブラウザに保存されている内容も上書きされます。"
      )
    ) {
      setPriorityTasks(defaultPriorityTasks.map((t) => ({ ...t, done: false })));
    }
  };

  const handleResetDailyToDefaults = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm(
        "毎日タスクを初期の3件に戻しますか？\n今の一覧は破棄され、ブラウザに保存されている内容も上書きされます。"
      )
    ) {
      setDailyTasks([...defaultDailyTasks]);
    }
  };

  const handleAddKohoTask = () => {
    const content = newKohoContent.trim();
    if (!content) return;
    setKohoTasks((prev) => [
      ...prev,
      {
        id: newKohoTaskId(),
        content,
        due: newKohoDue.trim(),
        done: false,
      },
    ]);
    setNewKohoContent("");
    setNewKohoDue("");
  };

  const handleUpdateKohoTask = (
    id: string,
    patch: Partial<Pick<KohoTaskItem, "content" | "due" | "done">>
  ) => {
    setKohoTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  };

  const handleDeleteKohoTask = (id: string) => {
    setKohoTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-16">
        <div className="text-4xl tracking-widest text-gray-900 mb-4">SPOTLIGHT FILMS</div>
        <h1 className="text-3xl tracking-wider text-gray-900 mb-2">組織構造図</h1>
        <p className="text-gray-500">Organization Dashboard</p>
      </div>

      {/* 組織図コンテンツ */}
      <div className="flex flex-col items-start space-y-16">
        {/* 最上部：司令本部、雑談部屋、気になること枠 */}
        <div className="flex flex-wrap gap-6 items-start w-full">
          {/* 司令本部（映画統括＋分野別4リンク） */}
          <div className="bg-gray-900 text-white px-8 py-6 rounded-lg shadow-lg min-w-[280px] max-w-xl">
            <div className="text-2xl mb-1 tracking-wide text-center">司令本部</div>
            <p className="text-xs text-gray-400 text-center mb-1 tracking-wider">
              意思決定 · 分野から開く
            </p>
            <p className="text-[10px] text-gray-500 text-center mb-3">
              右クリックでリンク先の変更・コピーなど
            </p>
            <div className="space-y-2">
              <a
                href={shireibuHref(shireibuTopLink.label)}
                target="_blank"
                rel="noopener noreferrer"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShireibuLinkMenu({
                    label: shireibuTopLink.label,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                className="flex w-full items-center justify-center text-center text-base font-semibold tracking-wide text-white bg-gray-800 border-2 border-amber-500/90 rounded-lg px-3 py-3.5 hover:bg-gray-700 hover:border-amber-400 transition-colors"
              >
                {shireibuTopLink.label}
              </a>
              <div className="flex gap-2 items-start">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <a
                    href={shireibuHref("映画編集")}
                    target="_blank"
                    rel="noopener noreferrer"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setShireibuLinkMenu({
                        label: "映画編集",
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    className="flex items-center justify-center text-center text-sm font-medium text-white bg-gray-800 border border-gray-600 rounded-lg px-3 py-3 hover:bg-gray-700 transition-colors"
                  >
                    映画編集
                  </a>
                  <a
                    href={shireibuHref("映画撮影")}
                    target="_blank"
                    rel="noopener noreferrer"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setShireibuLinkMenu({
                        label: "映画撮影",
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    className="flex items-center justify-center text-center text-sm font-medium text-white bg-gray-800 border border-gray-600 rounded-lg px-3 py-3 hover:bg-gray-700 transition-colors"
                  >
                    映画撮影
                  </a>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <a
                    href={shireibuHref("映画広報")}
                    target="_blank"
                    rel="noopener noreferrer"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setShireibuLinkMenu({
                        label: "映画広報",
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    className="flex items-center justify-center text-center text-sm font-medium text-white bg-gray-800 border border-gray-600 rounded-lg px-3 py-3 hover:bg-gray-700 transition-colors"
                  >
                    映画広報
                  </a>
                  <div
                    className="rounded-lg border border-gray-600 bg-gray-800/95 p-3 shadow-sm text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs font-semibold text-gray-100 mb-2">
                      広報タスク
                      <span className="block text-[10px] font-normal text-gray-400 mt-0.5">
                        映画『残すということ』
                      </span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {kohoTasks.length === 0 && (
                        <p className="text-[11px] text-gray-500 py-1">
                          下のフォームからタスクを追加できます
                        </p>
                      )}
                      {kohoTasks.map((t) => (
                        <div
                          key={t.id}
                          className={`rounded border border-gray-600 bg-gray-900/60 p-2 space-y-1.5 ${t.done ? "opacity-75" : ""}`}
                        >
                          <div className="flex items-start gap-2">
                            <label className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={t.done}
                                onChange={() =>
                                  handleUpdateKohoTask(t.id, {
                                    done: !t.done,
                                  })
                                }
                                className="size-3.5 rounded border-gray-500 bg-gray-900"
                                aria-label="完了"
                              />
                              <span className="text-[9px] text-gray-400 leading-none">
                                済
                              </span>
                            </label>
                            <input
                              type="text"
                              value={t.content}
                              onChange={(e) =>
                                handleUpdateKohoTask(t.id, {
                                  content: e.target.value,
                                })
                              }
                              className={`flex-1 min-w-0 text-xs rounded px-1.5 py-0.5 border border-gray-600 bg-gray-900 text-gray-100 focus:border-blue-400 focus:outline-none ${t.done ? "line-through text-gray-500" : ""}`}
                              placeholder="内容"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteKohoTask(t.id)}
                              className="shrink-0 text-red-400 hover:text-red-300 text-base leading-none px-0.5"
                              aria-label="削除"
                            >
                              ×
                            </button>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-400">期限</span>
                            <input
                              type="date"
                              value={t.due}
                              onChange={(e) =>
                                handleUpdateKohoTask(t.id, {
                                  due: e.target.value,
                                })
                              }
                              className="w-full text-[11px] rounded px-1.5 py-0.5 border border-gray-600 bg-gray-900 text-gray-200"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-600 space-y-2">
                      <input
                        type="text"
                        value={newKohoContent}
                        onChange={(e) => setNewKohoContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddKohoTask();
                        }}
                        placeholder="新しいタスクの内容"
                        className="w-full text-xs rounded px-2 py-1.5 border border-gray-600 bg-gray-900 text-gray-100 placeholder:text-gray-500"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-gray-400 shrink-0">期限</span>
                        <input
                          type="date"
                          value={newKohoDue}
                          onChange={(e) => setNewKohoDue(e.target.value)}
                          className="flex-1 min-w-[7rem] text-[11px] rounded px-1.5 py-0.5 border border-gray-600 bg-gray-900 text-gray-200"
                        />
                        <button
                          type="button"
                          onClick={handleAddKohoTask}
                          className="shrink-0 text-xs bg-amber-600 text-white px-2.5 py-1 rounded hover:bg-amber-500"
                        >
                          追加
                        </button>
                      </div>
                    </div>
                  </div>
                  <a
                    href={shireibuHref("映画上映")}
                    target="_blank"
                    rel="noopener noreferrer"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setShireibuLinkMenu({
                        label: "映画上映",
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    className="flex items-center justify-center text-center text-sm font-medium text-white bg-gray-800 border border-gray-600 rounded-lg px-3 py-3 hover:bg-gray-700 transition-colors"
                  >
                    映画上映
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 雑談部屋（レベル別4リンク） */}
          <div className="bg-yellow-100 border-2 border-yellow-400 px-8 py-6 rounded-lg shadow-md min-w-[280px] max-w-md hover:shadow-lg transition-shadow">
            <div className="text-xl text-yellow-800 tracking-wide mb-1 text-center">
              💬 雑談部屋
            </div>
            <p className="text-xs text-yellow-700 text-center mb-4 tracking-wide">
              レベルに合わせて開く
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="https://chatgpt.com/share/69d83663-efb8-83a7-95b7-6288f433af08"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-center text-sm font-medium text-yellow-900 bg-yellow-50 border border-yellow-500 rounded-lg px-3 py-3 hover:bg-yellow-200/80 transition-colors"
              >
                初期レベル
              </a>
              <a
                href="https://chatgpt.com/share/69d83691-dea8-83a2-bf64-c13659698f92"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-center text-sm font-medium text-yellow-900 bg-yellow-50 border border-yellow-500 rounded-lg px-3 py-3 hover:bg-yellow-200/80 transition-colors"
              >
                中レベル
              </a>
              <a
                href="https://chatgpt.com/share/69d3103a-4704-83a2-80e1-ec24f7ef4923"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-center text-sm font-medium text-yellow-900 bg-yellow-50 border border-yellow-500 rounded-lg px-3 py-3 hover:bg-yellow-200/80 transition-colors"
              >
                上レベル
              </a>
              <a
                href="https://chatgpt.com/share/69d836d3-bc5c-83ab-a2f1-473c588c6dbd"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-center text-sm font-medium text-yellow-900 bg-yellow-50 border border-yellow-500 rounded-lg px-3 py-3 hover:bg-yellow-200/80 transition-colors"
              >
                真面目
              </a>
            </div>
          </div>

          {/* 気になること枠 */}
          <div 
            className="bg-pink-50 border-2 border-pink-300 px-8 py-6 rounded-lg shadow-md min-w-[280px] cursor-pointer"
            onClick={() => setIsEditingMemo(true)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl text-pink-700 tracking-wide">📌 気になること</div>
              {isEditingMemo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingMemo(false);
                  }}
                  className="text-xs bg-pink-500 hover:bg-pink-600 text-white px-2 py-1 rounded"
                >
                  完了
                </button>
              )}
            </div>
            
            {isEditingMemo ? (
              <div className="text-sm text-gray-700 text-left space-y-2" onClick={(e) => e.stopPropagation()}>
                {memoItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleUpdateMemo(index, e.target.value)}
                      className="flex-1 bg-white px-3 py-2 rounded border border-pink-300 focus:outline-none focus:border-pink-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMemo(index);
                      }}
                      className="text-red-600 hover:text-red-800 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                {/* 新規追加フォーム */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newMemo}
                    onChange={(e) => setNewMemo(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMemo();
                      }
                    }}
                    placeholder="新しいメモを追加..."
                    className="flex-1 bg-white px-3 py-2 rounded border border-pink-300 focus:outline-none focus:border-pink-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMemo();
                    }}
                    className="text-green-600 hover:text-green-800 font-bold text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-700 text-left space-y-1">
                {memoItems.map((item, index) => (
                  <div key={index}>• {item}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 司令本部からの矢印と最優先・毎日する枠 */}
        <div className="flex flex-col items-start">
          {/* 下向き矢印（画像） */}
          <div className="ml-0 mb-4 flex justify-start">
            <FlowArrow />
          </div>
          
          {/* 最優先枠と毎日する枠を大きな枠で囲む */}
          <div className="border-4 border-gray-300 rounded-2xl p-8 bg-gray-50/30">
            <div className="flex gap-6 items-start justify-start">
              {/* 今日の最優先枠 */}
              <div 
                className="bg-red-50 border-2 border-red-400 px-8 py-6 rounded-lg shadow-md min-w-[320px] cursor-pointer"
                onClick={() => setIsEditingPriority(true)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xl text-red-700 tracking-wide">🎯 今日の最優先</div>
                  {isEditingPriority && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingPriority(false);
                      }}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                    >
                      完了
                    </button>
                  )}
                </div>
                
                {isEditingPriority ? (
                  <div className="text-sm text-gray-700 text-left space-y-2" onClick={(e) => e.stopPropagation()}>
                    {priorityTasks.map((task, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={task.task}
                          onChange={(e) => handleUpdatePriority(index, e.target.value, task.time)}
                          className="flex-1 bg-white px-3 py-2 rounded border border-red-300 focus:outline-none focus:border-red-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="relative">
                          <input
                            type="text"
                            value={task.time}
                            onChange={(e) => handleUpdatePriority(index, task.task, e.target.value)}
                            className="w-20 bg-white px-3 py-2 rounded border border-red-300 focus:outline-none focus:border-red-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              onClick={() => setEditingTimeIndex(index)}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </div>
                        </div>
                        <label
                          className="flex items-center gap-1 shrink-0 text-xs text-gray-600 cursor-pointer select-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => handleTogglePriorityDone(index)}
                            className="size-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="完了したらチェック"
                          />
                          済
                        </label>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePriority(index);
                          }}
                          className="text-red-600 hover:text-red-800 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    {/* 新規追加フォーム */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPriority();
                          }
                        }}
                        placeholder="新しいタスクを追加..."
                        className="flex-1 bg-white px-3 py-2 rounded border border-red-300 focus:outline-none focus:border-red-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <input
                        type="text"
                        value={newPriorityTime}
                        onChange={(e) => setNewPriorityTime(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPriority();
                          }
                        }}
                        placeholder="時間..."
                        className="w-20 bg-white px-3 py-2 rounded border border-red-300 focus:outline-none focus:border-red-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddPriority();
                        }}
                        className="text-green-600 hover:text-green-800 font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 text-left space-y-2" onClick={(e) => e.stopPropagation()}>
                    {priorityTasks.map((task, index) => (
                      <div
                        key={index}
                        className={`bg-white px-3 py-2 rounded border border-red-200 ${task.done ? "opacity-90" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 relative min-w-0">
                            {editingTaskIndex === index ? (
                              <div>
                                <input
                                  type="text"
                                  value={taskInputValue}
                                  onChange={(e) => setTaskInputValue(e.target.value)}
                                  onBlur={() => {
                                    if (taskInputValue.trim()) {
                                      handleUpdatePriority(index, taskInputValue, task.time);
                                    }
                                    setEditingTaskIndex(null);
                                  }}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      if (taskInputValue.trim()) {
                                        handleUpdatePriority(index, taskInputValue, task.time);
                                      }
                                      setEditingTaskIndex(null);
                                    }
                                  }}
                                  className="w-full bg-white px-2 py-1 rounded border border-red-300 focus:outline-none focus:border-red-500"
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                                {/* 過去の候補リスト */}
                                {taskHistory.length > 0 && taskInputValue.length > 0 && (
                                  <div className="absolute left-0 right-0 mt-1 bg-white border-2 border-red-300 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                    {taskHistory
                                      .filter(history => history.toLowerCase().includes(taskInputValue.toLowerCase()))
                                      .map((history, hIndex) => (
                                        <button
                                          key={hIndex}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTaskInputValue(history);
                                            handleUpdatePriority(index, history, task.time);
                                            setEditingTaskIndex(null);
                                          }}
                                          className="w-full text-left px-3 py-2 hover:bg-red-100 transition-colors text-sm"
                                        >
                                          {history}
                                        </button>
                                      ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskInputValue(task.task);
                                  setEditingTaskIndex(index);
                                  setEditingTimeIndex(null);
                                }}
                                className={`cursor-pointer hover:text-red-700 ${task.done ? "line-through text-gray-400" : ""}`}
                              >
                                {task.task}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTimeIndex(editingTimeIndex === index ? null : index);
                                  setEditingTaskIndex(null);
                                }}
                                className={`text-red-600 hover:text-red-700 font-medium px-2 py-1 border border-red-300 rounded bg-red-50 ${task.done ? "line-through opacity-70" : ""}`}
                              >
                                {task.time}
                              </button>
                              
                              {/* 時間選択ドロップダウン */}
                              {editingTimeIndex === index && (
                                <div 
                                  className="absolute right-0 mt-1 bg-white border-2 border-red-300 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto w-24"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {timeOptions.map((time) => (
                                    <button
                                      key={time}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdatePriority(index, task.task, time);
                                        setEditingTimeIndex(null);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-red-100 transition-colors text-sm"
                                    >
                                      {time}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <label
                              className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer select-none"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={task.done}
                                onChange={() => handleTogglePriorityDone(index)}
                                className="size-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="完了したらチェック"
                              />
                              済
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 可能な限り毎日する枠 */}
              <div 
                className="bg-blue-50 border-2 border-blue-400 px-8 py-6 rounded-lg shadow-md min-w-[320px] cursor-pointer"
                onClick={() => setIsEditingDaily(true)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xl text-blue-700 tracking-wide">🔄 可能な限り毎日する</div>
                  {isEditingDaily && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingDaily(false);
                      }}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      完了
                    </button>
                  )}
                </div>
                
                {isEditingDaily ? (
                  <div className="text-sm text-gray-700 text-left space-y-2" onClick={(e) => e.stopPropagation()}>
                    {dailyTasks.map((task, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={task}
                          onChange={(e) => handleUpdateDaily(index, e.target.value)}
                          className="flex-1 bg-white px-3 py-2 rounded border border-blue-300 focus:outline-none focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDaily(index);
                          }}
                          className="text-red-600 hover:text-red-800 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    {/* 新規追加フォーム */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={newDaily}
                        onChange={(e) => setNewDaily(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDaily();
                          }
                        }}
                        placeholder="新しい習慣を追加..."
                        className="flex-1 bg-white px-3 py-2 rounded border border-blue-300 focus:outline-none focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddDaily();
                        }}
                        className="text-green-600 hover:text-green-800 font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 text-left space-y-2">
                    {dailyTasks.map((task, index) => (
                      <div key={index} className="bg-white px-3 py-2 rounded border border-blue-200">
                        {task}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-300 flex flex-wrap gap-2 justify-end items-center">
              <span className="text-xs text-gray-500 mr-auto max-sm:w-full">
                リセットはここからのみ（日替わりなどの自動クリアはしません）
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetPriorityToDefaults();
                }}
                className="text-xs px-3 py-1.5 rounded border border-red-300 bg-white text-red-700 hover:bg-red-50"
              >
                最優先を初期状態に戻す
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetDailyToDefaults();
                }}
                className="text-xs px-3 py-1.5 rounded border border-blue-300 bg-white text-blue-700 hover:bg-blue-50"
              >
                毎日タスクを初期状態に戻す
              </button>
            </div>
          </div>
          
          {/* 下向き矢印（大きな枠の外） */}
          <div className="mt-8 ml-40">
            <FlowArrow />
          </div>
        </div>

        {/* KAIRŌ、資金ライン（並び・左寄せ） */}
        <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-start justify-start w-full">
          {/* プロジェクトKAIRŌセクション */}
          <div className="flex flex-col items-center">
            {/* KAIRŌヘダー（クック可能） */}
            <button
              onClick={() => setIsKairoExpanded(!isKairoExpanded)}
              className="inline-block bg-purple-600 text-white px-12 py-6 rounded-lg shadow-lg mb-8 hover:bg-purple-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl tracking-wide">KAIRŌ</div>
                <div className="text-xl">
                  {isKairoExpanded ? '▼' : '▶'}
                </div>
              </div>
            </button>

            {/* 下向き矢印 */}
            {isKairoExpanded && (
              <>
                <div className="w-0.5 h-12 bg-purple-300 mb-4"></div>
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-purple-300 mb-8"></div>
              </>
            )}

            {/* プロジェクト群を含む枠（展開時のみ表示） */}
            {isKairoExpanded && (
              <div className="border-4 border-purple-300 rounded-2xl p-12 bg-purple-50/30">
                {/* プロジェクト群（横並び） */}
                <div className="flex flex-col lg:flex-row gap-12 items-start justify-center">
                  {/* ロジェクト1: 残すということ */}
                  <div className="flex flex-col items-center">
                    {/* プロジェクト */}
                    <a 
                      href="https://chatgpt.com/g/g-p-69cf762e5b7c81918eefaec3323ad5c4-can-sutoiukoto-ying-hua/project"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-12 py-8 rounded-lg shadow-lg min-w-[320px] text-center hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <div className="text-2xl mb-2 tracking-wide">プロジェクト</div>
                      <div className="text-sm text-blue-100 tracking-wider">映画『残すということ</div>
                    </a>
                    
                    {/* 下向き矢印 */}
                    <div className="w-0.5 h-16 bg-gray-300 my-4"></div>
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-gray-300"></div>

                    {/* 3つの要素（横並び）— 映画『残すということ』 */}
                    <div className="flex flex-col md:flex-row gap-6 mt-8 items-stretch">
                      {/* 広報 */}
                      <div className="w-56 shrink-0">
                        <a
                          href="https://chatgpt.com/share/69d1a685-708c-83a7-8df5-895b36ce7ad7"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-white border-2 border-gray-200 px-6 py-6 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer"
                        >
                          <div className="text-center">
                            <div className="text-lg mb-3 text-gray-900 tracking-wide">広報</div>
                            <div className="h-px bg-gray-200 mb-3"></div>
                            <div className="space-y-1.5 text-gray-600">
                              <div className="text-xs tracking-wide">構造</div>
                              <div className="text-xs tracking-wide">LP</div>
                              <div className="text-xs tracking-wide">導線</div>
                            </div>
                          </div>
                        </a>
                      </div>

                      {/* 撮影・編集 */}
                      <div className="w-56">
                        <a 
                          href="https://chatgpt.com/share/69d1a69d-9c04-83ab-836a-55b3f0e9cebc"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-white border-2 border-gray-200 px-6 py-6 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer"
                        >
                          <div className="text-center">
                            <div className="text-lg mb-3 text-gray-900 tracking-wide">撮影・編集</div>
                            <div className="h-px bg-gray-200 mb-3"></div>
                            <div className="space-y-1.5 text-gray-600">
                              <div className="text-xs tracking-wide">映像</div>
                              <div className="text-xs tracking-wide">SNS</div>
                              <div className="text-xs tracking-wide">note</div>
                            </div>
                          </div>
                        </a>
                      </div>

                      {/* 上映 */}
                      <div className="w-56">
                        <a 
                          href="https://chatgpt.com/share/69d1a6ae-fb70-83aa-8b1c-c0e13e6e05be"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-white border-2 border-gray-200 px-6 py-6 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer"
                        >
                          <div className="text-center">
                            <div className="text-lg mb-3 text-gray-900 tracking-wide">上映</div>
                            <div className="h-px bg-gray-200 mb-3"></div>
                            <div className="space-y-1.5 text-gray-600">
                              <div className="text-xs tracking-wide">営業</div>
                              <div className="text-xs tracking-wide">収益</div>
                              <div className="text-xs tracking-wide">協賛</div>
                            </div>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* プロジェクト2: セッション */}
                  <div className="flex flex-col items-center">
                    {/* プロジェクト */}
                    <div className="bg-green-600 text-white px-12 py-8 rounded-lg shadow-lg min-w-[320px] text-center cursor-pointer hover:bg-green-700 transition-colors">
                      <div className="text-2xl mb-2 tracking-wide">プロジェクト</div>
                      <div className="text-sm text-green-100 tracking-wider">セッション</div>
                    </div>
                    
                    {/* 下向き矢印 */}
                    <div className="w-0.5 h-16 bg-gray-300 my-4"></div>
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-gray-300"></div>

                    {/* 3つの部署（横並び） */}
                    <div className="flex flex-col md:flex-row gap-6 mt-8 items-stretch">
                      {/* 設計部 */}
                      <div className="w-56">
                        <div className="block bg-white border-2 border-gray-200 px-6 py-6 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer">
                          <div className="text-center">
                            <div className="text-lg mb-3 text-gray-900 tracking-wide">設計部</div>
                            <div className="h-px bg-gray-200 mb-3"></div>
                            <div className="space-y-1.5 text-gray-600">
                              <div className="text-xs tracking-wide">構造</div>
                              <div className="text-xs tracking-wide">LP</div>
                              <div className="text-xs tracking-wide">導線</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* コンテンツ部 */}
                      <div className="w-56">
                        <div className="block bg-white border-2 border-gray-200 px-6 py-6 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer">
                          <div className="text-center">
                            <div className="text-lg mb-3 text-gray-900 tracking-wide">コンンツ部</div>
                            <div className="h-px bg-gray-200 mb-3"></div>
                            <div className="space-y-1.5 text-gray-600">
                              <div className="text-xs tracking-wide">映像</div>
                              <div className="text-xs tracking-wide">SNS</div>
                              <div className="text-xs tracking-wide">note</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ビジネス部 */}
                      <div className="w-56">
                        <div className="block bg-white border-2 border-gray-200 px-6 py-6 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer">
                          <div className="text-center">
                            <div className="text-lg mb-3 text-gray-900 tracking-wide">ビジネス部</div>
                            <div className="h-px bg-gray-200 mb-3"></div>
                            <div className="space-y-1.5 text-gray-600">
                              <div className="text-xs tracking-wide">営業</div>
                              <div className="text-xs tracking-wide">収益</div>
                              <div className="text-xs tracking-wide">協賛</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 資金ラインセクション */}
          <div className="flex flex-col items-center">
            {/* 資金ラインヘッダー（クリック可能） */}
            <button
              onClick={() => setIsShikinExpanded(!isShikinExpanded)}
              className="inline-block bg-orange-600 text-white px-12 py-6 rounded-lg shadow-lg mb-8 hover:bg-orange-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl tracking-wide">資金ライン</div>
                <div className="text-xl">
                  {isShikinExpanded ? '▼' : '▶'}
                </div>
              </div>
            </button>

            {/* 下向き矢印 */}
            {isShikinExpanded && (
              <>
                <div className="w-0.5 h-12 bg-orange-300 mb-4"></div>
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-orange-300 mb-8"></div>
              </>
            )}

            {/* 資金ライン要素を含む枠（展開時のみ表示） */}
            {isShikinExpanded && (
              <div className="border-4 border-orange-300 rounded-2xl p-8 bg-orange-50/30">
                <div className="flex flex-col md:flex-row gap-6 items-stretch">
                  {/* 配送 */}
                  <div className="w-48">
                    <div className="block bg-white border-2 border-gray-200 px-6 py-6 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer">
                      <div className="text-center">
                        <div className="text-lg text-gray-900 tracking-wide">配送</div>
                      </div>
                    </div>
                  </div>

                  {/* バイト */}
                  <div className="w-48">
                    <div className="block bg-white border-2 border-gray-200 px-6 py-6 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer">
                      <div className="text-center">
                        <div className="text-lg text-gray-900 tracking-wide">バト</div>
                      </div>
                    </div>
                  </div>

                  {/* 短期収入 */}
                  <div className="w-48">
                    <div className="block bg-white border-2 border-gray-200 px-6 py-6 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer">
                      <div className="text-center">
                        <div className="text-lg text-gray-900 tracking-wide">短期収入</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {shireibuLinkMenu && (
        <div
          role="menu"
          className="fixed z-[100] min-w-[200px] rounded-lg border border-gray-600 bg-gray-900 py-1 text-sm text-white shadow-xl"
          style={{
            left: Math.max(
              8,
              Math.min(shireibuLinkMenu.x, window.innerWidth - 220)
            ),
            top: Math.max(
              8,
              Math.min(shireibuLinkMenu.y, window.innerHeight - 200)
            ),
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="border-b border-gray-700 px-3 py-2 text-xs text-gray-400">
            {shireibuLinkMenu.label}
          </div>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left hover:bg-gray-800"
            onClick={() => {
              window.open(shireibuHref(shireibuLinkMenu.label), "_blank", "noopener,noreferrer");
              setShireibuLinkMenu(null);
            }}
          >
            このリンクを開く
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left hover:bg-gray-800"
            onClick={async () => {
              const label = shireibuLinkMenu.label;
              const current = shireibuHref(label);
              const input = window.prompt(`${label} のリンク先 URL`, current);
              setShireibuLinkMenu(null);
              if (input === null) return;
              const trimmed = input.trim();
              if (!trimmed) {
                window.alert("URL が空です。キャンセルする場合は「キャンセル」を押してください。");
                return;
              }
              if (!isValidHttpUrl(trimmed)) {
                window.alert("http または https で始まる URL を入力してください。");
                return;
              }
              setShireibuOverrides((prev) => ({ ...prev, [label]: trimmed }));
            }}
          >
            リンク先を設定…
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left hover:bg-gray-800"
            onClick={() => {
              const label = shireibuLinkMenu.label;
              setShireibuLinkMenu(null);
              setShireibuOverrides((prev) => {
                const next = { ...prev };
                delete next[label];
                return next;
              });
            }}
          >
            コードの初期リンクに戻す
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left hover:bg-gray-800"
            onClick={async () => {
              const url = shireibuHref(shireibuLinkMenu.label);
              setShireibuLinkMenu(null);
              try {
                await navigator.clipboard.writeText(url);
              } catch {
                window.prompt("コピーできない環境です。手でコピーしてください:", url);
              }
            }}
          >
            リンクをコピー
          </button>
        </div>
      )}

      {/* フッター */}
      <div className="mt-20 text-center text-sm text-gray-400">
        <p>更新日：2026年4月4日</p>
      </div>
    </div>
  );
}