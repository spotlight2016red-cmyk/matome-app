"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getConfirmedAuthStatus } from "@/app/lib/confirmedSession";
import {
  AVATAR_DIAGNOSIS_QUESTIONS,
  AVATAR_TYPE_RESULT_COPY,
  computeAvatarDiagnosisResult,
} from "@/app/lib/avatarDiagnosis";
import {
  getAvatarFallbackImage,
  getAvatarImage,
  normalizeAvatarType,
  type AvatarType,
} from "@/app/lib/avatarImage";

const RESULT_REVEAL_MS = 480;

export function AvatarDiagnosisClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/home";
  const redo = searchParams.get("redo") === "1";

  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [serverAvatarType, setServerAvatarType] = React.useState<AvatarType | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [step, setStep] = React.useState(0);
  const [aggregating, setAggregating] = React.useState(false);
  const [result, setResult] = React.useState<AvatarType | null>(null);
  const [smallGoalHint, setSmallGoalHint] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const revealTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const auth = await getConfirmedAuthStatus();
        if (!mounted) return;
        if (auth === "unconfirmed") {
          window.location.assign("/login?notice=email_unconfirmed");
          return;
        }
        const ok = auth === "confirmed";
        setAuthed(ok);
        if (!ok) {
          setLoading(false);
          return;
        }
        const res = await fetch("/api/profile", { method: "GET" });
        const json = (await res.json()) as { ok?: boolean; avatarType?: string | null };
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

  React.useEffect(() => {
    if (!result || aggregating) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/goals", { method: "GET" });
        const json = (await res.json()) as { ok?: boolean; goals?: { small_goal?: string }[] };
        if (cancelled || !json?.ok) return;
        const raw = json.goals?.[0]?.small_goal;
        const t = typeof raw === "string" ? raw.trim() : "";
        setSmallGoalHint(t || null);
      } catch {
        if (!cancelled) setSmallGoalHint(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [result, aggregating]);

  const totalSteps = AVATAR_DIAGNOSIS_QUESTIONS.length;

  const selectOption = React.useCallback(
    (optionId: string) => {
      setError(null);
      const q = AVATAR_DIAGNOSIS_QUESTIONS[step];
      const merged = { ...answers, [q.id]: optionId };
      setAnswers(merged);
      if (step >= totalSteps - 1) {
        if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
        setAggregating(true);
        setSmallGoalHint(null);
        revealTimerRef.current = setTimeout(() => {
          setResult(computeAvatarDiagnosisResult(merged));
          setAggregating(false);
          revealTimerRef.current = null;
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, RESULT_REVEAL_MS);
      } else {
        setStep((s) => s + 1);
      }
    },
    [answers, step, totalSteps],
  );

  const goBack = React.useCallback(() => {
    if (aggregating) {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
      setAggregating(false);
      const currentQId = AVATAR_DIAGNOSIS_QUESTIONS[step].id;
      setAnswers((prev) => {
        const nextAns = { ...prev };
        delete nextAns[currentQId];
        return nextAns;
      });
      setError(null);
      return;
    }
    if (result || step <= 0) return;
    const currentQId = AVATAR_DIAGNOSIS_QUESTIONS[step].id;
    setAnswers((prev) => {
      const nextAns = { ...prev };
      delete nextAns[currentQId];
      return nextAns;
    });
    setStep((s) => s - 1);
    setError(null);
  }, [aggregating, result, step]);

  const reset = React.useCallback(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    setAnswers({});
    setStep(0);
    setAggregating(false);
    setResult(null);
    setSmallGoalHint(null);
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
      const json = (await res.json()) as { ok?: boolean; error?: string };
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

  const copy = result ? AVATAR_TYPE_RESULT_COPY[result] : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <section className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide text-gray-900">
            {redo ? "アバター再診断" : "初回アバター診断"}
          </h1>
          {serverAvatarType && (
            <span className="ui-pill">現在: {AVATAR_TYPE_RESULT_COPY[serverAvatarType].label}</span>
          )}
        </div>
        <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
          5問をタップで選択。結果画面でタイプと攻略のヒントを確認してから進みます。
        </p>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      {aggregating ? (
        <section
          className="rounded-3xl border border-violet-200 bg-gradient-to-b from-violet-50/90 to-white px-8 py-14 text-center shadow-sm"
          aria-live="polite"
        >
          <div className="mx-auto mb-4 size-10 rounded-full border-2 border-violet-300 border-t-violet-700 animate-spin" />
          <p className="text-sm font-semibold text-violet-950">結果を集計しています…</p>
          <p className="mt-2 text-xs text-violet-800/80">このあと結果画面が表示されます（まだ保存・遷移はしません）</p>
        </section>
      ) : result && copy ? (
        <section className="rounded-3xl border-2 border-gray-900/10 bg-white/95 shadow-md backdrop-blur px-5 py-7 sm:px-8 sm:py-8">
          <header className="mb-6 border-b border-gray-200 pb-5 text-center sm:text-left">
            <p className="text-xs font-semibold tracking-widest text-violet-700">診断の結果</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              あなたは {copy.label} タイプ
            </h2>
          </header>

          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
            <div className="shrink-0 mx-auto sm:mx-0 rounded-3xl bg-white border border-gray-200 overflow-hidden shadow-lg ring-2 ring-violet-100 size-36 sm:size-40">
              <img
                src={getAvatarImage(result, 1, { points: 0 })}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = getAvatarFallbackImage();
                }}
                alt={`avatar_${result}`}
                className="size-full object-cover"
                width={160}
                height={160}
              />
            </div>

            <div className="min-w-0 flex-1 w-full space-y-5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  このタイプの特徴
                </h3>
                <div className="space-y-2">
                  {copy.traitLines.map((line, i) => (
                    <p key={i} className="text-sm text-gray-800 leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 sm:px-5 sm:py-5">
                <h3 className="text-sm font-semibold text-amber-950">攻略ポイント（どう動くと強いか）</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-amber-950/90 space-y-1.5 leading-relaxed">
                  {copy.strategyBullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-sky-200/80 bg-sky-50/90 px-4 py-4 sm:px-5 sm:py-5">
                <h3 className="text-sm font-semibold text-sky-950">初回の次の一手（NextMove のヒント）</h3>
                <p className="mt-2 text-sm text-sky-950/90 leading-relaxed">{copy.suggestedFirstMove}</p>
                {smallGoalHint ? (
                  <p className="mt-3 text-xs text-sky-900/85 leading-relaxed border-t border-sky-200/80 pt-3">
                    登録済みの小ゴールと組み合わせるなら：
                    <span className="font-semibold text-sky-950"> {smallGoalHint}</span>
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-sky-800/80">
                    小ゴールは「ゴール整理」から設定すると、状態チェックの NextMove と連動しやすくなります。
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                「このキャラで進む」でタイプを保存し、その先へ移動します。
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className={[
                    "inline-flex w-full sm:w-auto min-h-[52px] items-center justify-center rounded-2xl px-6 py-4 text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-violet-300",
                    saving ? "bg-gray-200 text-gray-500" : "bg-gray-900 text-white hover:bg-gray-800",
                  ].join(" ")}
                >
                  {saving ? "保存中…" : "このキャラで進む"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  disabled={saving}
                  className="inline-flex w-full sm:w-auto min-h-[52px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  もう一度やり直す
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div
            className="mb-6 flex gap-1.5"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label={`質問 ${step + 1} / ${totalSteps}`}
          >
            {AVATAR_DIAGNOSIS_QUESTIONS.map((q, i) => (
              <div
                key={q.id}
                className={[
                  "h-2 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-gray-900" : "bg-gray-200",
                ].join(" ")}
              />
            ))}
          </div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              質問 {step + 1} / {totalSteps}
            </span>
            <button
              type="button"
              onClick={goBack}
              disabled={step <= 0 && !aggregating}
              className={[
                "text-sm font-semibold rounded-xl px-3 py-2",
                step <= 0 && !aggregating
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100",
              ].join(" ")}
            >
              ← ひとつ前へ
            </button>
          </div>

          <section className="rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur px-5 py-6 sm:px-7 sm:py-7">
            <div className="text-base sm:text-lg font-semibold text-gray-900 mb-5 leading-snug">
              {AVATAR_DIAGNOSIS_QUESTIONS[step].title}
            </div>
            <div className="grid grid-cols-1 gap-3">
              {AVATAR_DIAGNOSIS_QUESTIONS[step].options.map((o) => {
                const selected = answers[AVATAR_DIAGNOSIS_QUESTIONS[step].id] === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => selectOption(o.id)}
                    className={[
                      "rounded-2xl border px-4 py-4 sm:py-5 text-left transition-colors",
                      selected
                        ? "border-gray-900 bg-gray-900 text-white ring-2 ring-gray-900/20"
                        : "border-gray-200 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50 active:scale-[0.99]",
                    ].join(" ")}
                    aria-pressed={selected}
                  >
                    <span className="text-sm sm:text-base font-semibold leading-snug">{o.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}

      {!aggregating && (
        <div className="mt-6 text-xs text-gray-500">
          <Link href={next} className="underline underline-offset-2">
            {result ? "保存せずに戻る" : "いったん戻る"}
          </Link>
          {result && (
            <span className="block mt-1 text-gray-400">
              戻るとタイプはまだ保存されません（ホームでは未診断のままの場合があります）。
            </span>
          )}
        </div>
      )}
    </div>
  );
}
