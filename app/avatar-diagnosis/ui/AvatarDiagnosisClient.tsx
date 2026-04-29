"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/app/lib/supabase/browser";
import {
  getAvatarFallbackImage,
  getAvatarImage,
  normalizeAvatarType,
  type AvatarType,
} from "@/app/lib/avatarImage";

type Question = {
  id: string;
  title: string;
  options: { id: string; label: string; scores: Partial<Record<AvatarType, number>> }[];
};

const QUESTIONS: readonly Question[] = [
  {
    id: "q1",
    title: "困っている人がいたら？",
    options: [
      { id: "a", label: "まず話を聞いて、気持ちを整える", scores: { healer: 2 } },
      { id: "b", label: "安全を確保して、守る段取りを作る", scores: { guardian: 2 } },
      { id: "c", label: "一緒に未知を試して、突破口を探す", scores: { explorer: 2 } },
      { id: "d", label: "手順に分けて、やり方を変換する", scores: { transformer: 2 } },
      { id: "e", label: "まず方向を示して、次の一手を決める", scores: { guide: 2 } },
    ],
  },
  {
    id: "q2",
    title: "調子が落ちた時に頼りたいのは？",
    options: [
      { id: "a", label: "休む/回復の設計", scores: { healer: 2, guardian: 1 } },
      { id: "b", label: "優先順位の整理", scores: { guide: 2 } },
      { id: "c", label: "環境の見直し", scores: { guardian: 2 } },
      { id: "d", label: "新しい刺激/探索", scores: { explorer: 2 } },
      { id: "e", label: "手順化/仕組み化", scores: { transformer: 2 } },
    ],
  },
  {
    id: "q3",
    title: "物事を進める時のクセは？",
    options: [
      { id: "a", label: "まず全体像を掴んで道を作る", scores: { guide: 2 } },
      { id: "b", label: "安心できる土台を固めてから動く", scores: { guardian: 2 } },
      { id: "c", label: "試しながら最適解に近づく", scores: { explorer: 2 } },
      { id: "d", label: "分解して組み直す", scores: { transformer: 2 } },
      { id: "e", label: "回復やペース配分を最優先する", scores: { healer: 2 } },
    ],
  },
  {
    id: "q4",
    title: "友達に言われがちなことは？",
    options: [
      { id: "a", label: "落ち着くと安心する", scores: { healer: 2 } },
      { id: "b", label: "頼れる・守ってくれる", scores: { guardian: 2 } },
      { id: "c", label: "面白いことを思いつく", scores: { explorer: 2 } },
      { id: "d", label: "整理がうまい/仕組み化できる", scores: { transformer: 2 } },
      { id: "e", label: "道筋を示してくれる", scores: { guide: 2 } },
    ],
  },
  {
    id: "q5",
    title: "迷った時に強いのは？",
    options: [
      { id: "a", label: "選択肢を1つに絞る", scores: { guide: 2 } },
      { id: "b", label: "心身を整えて判断できる状態に戻す", scores: { healer: 2 } },
      { id: "c", label: "リスクを潰して安心を作る", scores: { guardian: 2 } },
      { id: "d", label: "新しい視点を試す", scores: { explorer: 2 } },
      { id: "e", label: "ルール/手順に落とす", scores: { transformer: 2 } },
    ],
  },
  {
    id: "q6",
    title: "最高の「次の一手」は？",
    options: [
      { id: "a", label: "いま最短の一手を決める", scores: { guide: 2 } },
      { id: "b", label: "回復して、明日も動ける状態にする", scores: { healer: 2 } },
      { id: "c", label: "守りを固めて、事故を減らす", scores: { guardian: 2 } },
      { id: "d", label: "試して学んで、突破口を作る", scores: { explorer: 2 } },
      { id: "e", label: "仕組みにして、再現できる形にする", scores: { transformer: 2 } },
    ],
  },
] as const;

const TYPE_META: Record<AvatarType, { label: string; desc: string }> = {
  guide: { label: "Guide", desc: "迷いを減らして、次の一手を決めるタイプ" },
  healer: { label: "Healer", desc: "回復とペースを整えて、継続力を作るタイプ" },
  guardian: { label: "Guardian", desc: "安心の土台を作って、事故を減らすタイプ" },
  explorer: { label: "Explorer", desc: "試して学んで、突破口を見つけるタイプ" },
  transformer: { label: "Transformer", desc: "分解と再構築で、再現できる形にするタイプ" },
};

function computeResult(answers: Record<string, string>): AvatarType {
  const score: Record<AvatarType, number> = {
    guide: 0,
    healer: 0,
    guardian: 0,
    explorer: 0,
    transformer: 0,
  };
  for (const q of QUESTIONS) {
    const picked = answers[q.id];
    const opt = q.options.find((o) => o.id === picked);
    if (!opt) continue;
    for (const [k, v] of Object.entries(opt.scores)) {
      score[k as AvatarType] += Number(v ?? 0);
    }
  }
  const order: readonly AvatarType[] = ["guide", "healer", "guardian", "explorer", "transformer"];
  let best: AvatarType = "explorer";
  let bestScore = -1;
  for (const t of order) {
    const s = score[t];
    if (s > bestScore) {
      best = t;
      bestScore = s;
    }
  }
  return best;
}

export function AvatarDiagnosisClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/home";
  const redo = searchParams.get("redo") === "1";

  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [serverAvatarType, setServerAvatarType] = React.useState<AvatarType | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<AvatarType | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sb = supabaseBrowser();
        const { data } = await sb.auth.getSession();
        if (!mounted) return;
        const ok = Boolean(data.session);
        setAuthed(ok);
        if (!ok) {
          setLoading(false);
          return;
        }
        const res = await fetch("/api/profile", { method: "GET" });
        const json = (await res.json()) as any;
        if (!mounted) return;
        if (res.status === 401) {
          setAuthed(false);
          setLoading(false);
          return;
        }
        if (json?.ok) {
          const at = json.avatarType;
          if (typeof at === "string") {
            setServerAvatarType(normalizeAvatarType(at));
            if (!redo) {
              router.replace(next);
              return;
            }
          } else {
            setServerAvatarType(null);
          }
        }
        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "読み込みに失敗しました");
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [next, redo, router]);

  const allAnswered = React.useMemo(() => {
    return QUESTIONS.every((q) => Boolean(answers[q.id]));
  }, [answers]);

  const showResult = React.useCallback(() => {
    setError(null);
    if (!allAnswered) return;
    setResult(computeResult(answers));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [allAnswered, answers]);

  const reset = React.useCallback(() => {
    setAnswers({});
    setResult(null);
    setError(null);
  }, []);

  const save = React.useCallback(async () => {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/avatar-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarType: result }),
      });
      const json = (await res.json()) as any;
      if (res.status === 401) throw new Error("ログインしてください");
      if (!json?.ok) throw new Error(json?.error ?? "保存に失敗しました");
      router.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [next, result, router]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 text-sm text-gray-600">
        読み込み中…
      </div>
    );
  }

  if (authed === false) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <section className="rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur px-6 py-6">
          <div className="text-lg font-semibold text-gray-900 mb-2">初回アバター診断</div>
          <p className="text-sm text-gray-700 leading-relaxed">
            ログインすると、診断結果を保存してアバタータイプが確定します。
          </p>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-gray-900 px-5 py-4 text-sm font-semibold text-white shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              ログインへ
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <section className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide text-gray-900">
            {redo ? "アバター再診断" : "初回アバター診断"}
          </h1>
          {serverAvatarType && (
            <span className="ui-pill">現在: {TYPE_META[serverAvatarType].label}</span>
          )}
        </div>
        <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
          6問だけ答えると、あなたの攻略スタイル（アバタータイプ）を決めます。
        </p>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      {result ? (
        <section className="rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur px-6 py-6">
          <div className="flex items-start gap-5">
            <div className="shrink-0 rounded-3xl bg-white border border-gray-200 overflow-hidden shadow-lg ring-2 ring-gray-100 size-28">
              <img
                src={getAvatarImage(result, 1, { points: 0 })}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = getAvatarFallbackImage();
                }}
                alt={`avatar_${result}`}
                className="size-full object-cover"
                width={112}
                height={112}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-500 mb-1">診断結果</div>
              <div className="text-xl font-semibold text-gray-900">
                {TYPE_META[result].label}
              </div>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                {TYPE_META[result].desc}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className={[
                    "inline-flex w-full sm:w-auto items-center justify-center rounded-2xl px-5 py-4 text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300",
                    saving ? "bg-gray-200 text-gray-500" : "bg-gray-900 text-white hover:bg-gray-800",
                  ].join(" ")}
                >
                  {saving ? "保存中…" : "このタイプで確定"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  もう一度やり直す
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="space-y-4">
            {QUESTIONS.map((q) => (
              <section
                key={q.id}
                className="rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur px-6 py-6"
              >
                <div className="text-sm font-semibold text-gray-900 mb-3">{q.title}</div>
                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((o) => {
                    const selected = answers[q.id] === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: o.id }))}
                        className={[
                          "rounded-2xl border px-4 py-3 text-left",
                          selected
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                        ].join(" ")}
                        aria-pressed={selected}
                      >
                        <div className={selected ? "text-sm font-semibold" : "text-sm font-semibold"}>
                          {o.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={showResult}
              disabled={!allAnswered}
              className={[
                "w-full rounded-2xl px-4 py-4 text-sm sm:text-base font-semibold",
                "focus:outline-none focus:ring-2 focus:ring-gray-300",
                allAnswered
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed",
              ].join(" ")}
            >
              結果を見る
            </button>
            {!allAnswered && (
              <p className="mt-2 text-xs text-gray-500">
                6問すべて回答すると結果が表示できます。
              </p>
            )}
          </div>
        </>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <Link href={next} className="underline underline-offset-2">
          いったん戻る
        </Link>
      </div>
    </div>
  );
}

