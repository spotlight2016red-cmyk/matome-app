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

const defaultPriorityTasks: PriorityTaskItem[] = [
  { task: "最優先タスク1", time: "10:00", done: false },
  { task: "最優先タスク2", time: "14:00", done: false },
  { task: "最優先タスク3", time: "16:30", done: false },
];
const defaultDailyTasks = ["毎日タスク1", "毎日タスク2", "毎日タスク3"];

export function OrganizationChart() {
  const [isKairoExpanded, setIsKairoExpanded] = React.useState(true);
  const [isShikinExpanded, setIsShikinExpanded] = React.useState(true);
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
          {/* 司令本部 */}
          <a 
            href="https://chatgpt.com/g/g-p-691ecfa61b688191aff053276412376b-esientomoto/c/69cf0247-24a8-83aa-8d84-2762c83d6a7c"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-900 text-white px-12 py-8 rounded-lg shadow-lg min-w-[320px] text-center hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <div className="text-2xl mb-2 tracking-wide">司令本部</div>
            <div className="text-sm text-gray-300 tracking-wider">意思決定</div>
          </a>

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

                    {/* 3つの部署（横並び） */}
                    <div className="flex flex-col md:flex-row gap-6 mt-8 items-stretch">
                      {/* 設計部 */}
                      <div className="w-56">
                        <a 
                          href="https://chatgpt.com/share/69d1a685-708c-83a7-8df5-895b36ce7ad7"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-white border-2 border-gray-200 px-6 py-6 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer"
                        >
                          <div className="text-center">
                            <div className="text-lg mb-3 text-gray-900 tracking-wide">設計部</div>
                            <div className="h-px bg-gray-200 mb-3"></div>
                            <div className="space-y-1.5 text-gray-600">
                              <div className="text-xs tracking-wide">構造</div>
                              <div className="text-xs tracking-wide">LP</div>
                              <div className="text-xs tracking-wide">導線</div>
                            </div>
                          </div>
                        </a>
                      </div>

                      {/* コンテンツ部 */}
                      <div className="w-56">
                        <a 
                          href="https://chatgpt.com/share/69d1a69d-9c04-83ab-836a-55b3f0e9cebc"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-white border-2 border-gray-200 px-6 py-6 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer"
                        >
                          <div className="text-center">
                            <div className="text-lg mb-3 text-gray-900 tracking-wide">コンテンツ部</div>
                            <div className="h-px bg-gray-200 mb-3"></div>
                            <div className="space-y-1.5 text-gray-600">
                              <div className="text-xs tracking-wide">映像</div>
                              <div className="text-xs tracking-wide">SNS</div>
                              <div className="text-xs tracking-wide">note</div>
                            </div>
                          </div>
                        </a>
                      </div>

                      {/* ビジネス部 */}
                      <div className="w-56">
                        <a 
                          href="https://chatgpt.com/share/69d1a6ae-fb70-83aa-8b1c-c0e13e6e05be"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-white border-2 border-gray-200 px-6 py-6 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer"
                        >
                          <div className="text-center">
                            <div className="text-lg mb-3 text-gray-900 tracking-wide">ビジネス部</div>
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

      {/* フッター */}
      <div className="mt-20 text-center text-sm text-gray-400">
        <p>更新日：2026年4月4日</p>
      </div>
    </div>
  );
}