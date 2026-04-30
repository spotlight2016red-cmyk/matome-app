"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/app/lib/supabase/browser";
import {
  AVATAR_DIAGNOSIS_QUESTIONS,
  AVATAR_TYPE_META,
  computeAvatarDiagnosisResult,
} from "@/app/lib/avatarDiagnosis";
import {
  getAvatarFallbackImage,
  getAvatarImage,
  normalizeAvatarType,
  type AvatarType,
} from "@/app/lib/avatarImage";

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

  const totalSteps = AVATAR_DIAGNOSIS_QUESTIONS.length;

  const selectOption = React.useCallback(
    (optionId: string) => {
      setError(null);
      const q = AVATAR_DIAGNOSIS_QUESTIONS[step];
      const merged = { ...answers, [q.id]: optionId };
      setAnswers(merged);
      if (step >= totalSteps - 1) {
        setResult(computeAvatarDiagnosisResult(merged));
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setStep((s) => s + 1);
      }
    },
    [answers, step, totalSteps],
  );

  const goBack = React.useCallback(() => {
    if (result || step <= 0) return;
    const currentQId = AVATAR_DIAGNOSIS_QUESTIONS[step].id;
    setAnswers((prev) => {
      const nextAns = { ...prev };
      delete nextAns[currentQId];
      return nextAns;
    });
    setStep((s) => s - 1);
    setError(null);
  }, [result, step]);

  const reset = React.useCallback(() => {
    setAnswers({});
    setStep(0);
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

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <section className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide text-gray-900">
            {redo ? "アバター再診断" : "初回アバター診断"}
          </h1>
          {serverAvatarType && (
            <span className="ui-pill">現在: {AVATAR_TYPE_META[serverAvatarType].label}</span>
          )}
        </div>
        <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
          5問をタップで選択。あなたに近い「自分のキャラ」タイプがすぐ分かります。
        </p>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      {result ? (
        <section className="rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="shrink-0 mx-auto sm:mx-0 rounded-3xl bg-white border border-gray-200 overflow-hidden shadow-lg ring-2 ring-gray-100 size-32 sm:size-36">
              <img
                src={getAvatarImage(result, 1, { points: 0 })}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = getAvatarFallbackImage();
                }}
                alt={`avatar_${result}`}
                className="size-full object-cover"
                width={144}
                height={144}
              />
            </div>
            <div className="min-w-0 flex-1 w-full text-center sm:text-left">
              <div className="text-xs text-gray-500 mb-2">診断結果</div>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug">
                あなたは {AVATAR_TYPE_META[result].label} タイプ
              </p>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                {AVATAR_TYPE_META[result].desc}
              </p>
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                保存すると、このアバターがマイページなどに反映されます。
              </p>
              <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-3">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className={[
                    "inline-flex w-full sm:w-auto min-h-[52px] items-center justify-center rounded-2xl px-5 py-4 text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300",
                    saving ? "bg-gray-200 text-gray-500" : "bg-gray-900 text-white hover:bg-gray-800",
                  ].join(" ")}
                >
                  {saving ? "保存中…" : next === "/home" ? "ホームへ進む（保存）" : "結果を保存して進む"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex w-full sm:w-auto min-h-[52px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
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
              disabled={step <= 0}
              className={[
                "text-sm font-semibold rounded-xl px-3 py-2",
                step <= 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100",
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

      <div className="mt-6 text-xs text-gray-500">
        <Link href={next} className="underline underline-offset-2">
          いったん戻る
        </Link>
      </div>
    </div>
  );
}
