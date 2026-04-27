import Link from "next/link";
import { listDiagnosisRuns } from "@/app/state-check/_server/diagnosisRepo";
import { listDaySummaries } from "@/app/state-check/_server/daySummaryRepo";
import { DaySummaryEditor } from "./ui/DaySummaryEditor";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function snippet(s: string | null) {
  const t = (s ?? "").trim().replace(/\s+/g, " ");
  if (!t) return "（メモなし）";
  return t.length > 52 ? `${t.slice(0, 52)}…` : t;
}

function formatDayKey(dayKey: string) {
  return dayKey;
}

function kindLabel(kind: string | null | undefined) {
  if (kind === "morning") return "午前チェック";
  if (kind === "night") return "夜メモ";
  return "追加チェック";
}

function timeHHMM(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function dayKeyFromCreatedAt(iso: string) {
  // Fallback grouping if day_key isn't present yet
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  // Asia/Tokyo offset is not guaranteed here, but good enough for fallback.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function summarizeRecovery(morning: any, night: any) {
  if (!morning || !night) return null;
  const badA =
    morning.fatigue_score + morning.confusion_score + morning.recovery_score;
  const badB = night.fatigue_score + night.confusion_score + night.recovery_score;
  const delta = badB - badA;
  if (delta <= -2) return "朝→夜で戻れた（負荷が軽くなった）";
  if (delta >= 2) return "朝→夜で重くなった（早めに調整したい）";
  return "朝→夜で大きな変化は小さめ";
}

export default async function StateCheckHistoryPage() {
  const runs = await listDiagnosisRuns({ limit: 50 });
  const summaries = await listDaySummaries({ limit: 30 });
  const summaryByDay = new Map(
    summaries.map((s: any) => [String(s.day_key), s] as const)
  );

  const groups = new Map<string, any[]>();
  for (const r of runs as any[]) {
    const dk = r.day_key ? String(r.day_key) : dayKeyFromCreatedAt(r.created_at);
    const arr = groups.get(dk) ?? [];
    arr.push(r);
    groups.set(dk, arr);
  }
  const dayKeys = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="size-full min-h-screen ui-app-bg px-5 py-10 sm:px-8 sm:py-14 md:px-16">
      <div className="mx-auto w-full max-w-7xl">
        <div className="w-full max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/state-check"
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline underline-offset-2"
          >
            ← 診断に戻る
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide text-gray-900 mb-3">
          診断履歴
        </h1>
        <p className="text-sm text-gray-700 leading-relaxed mb-6">
          日付・結果・メモの冒頭・スコアを見返せます。
        </p>

        {runs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-6 text-sm text-gray-700">
            まだ履歴がありません。結果画面で保存すると、ここにたまっていきます。
          </div>
        ) : (
          <div className="space-y-6">
            {dayKeys.map((dayKey) => {
              const items = (groups.get(dayKey) ?? []).sort((a, b) =>
                a.created_at < b.created_at ? -1 : 1
              );
              const morning = items.find((x) => x.run_kind === "morning");
              const night = [...items].reverse().find((x) => x.run_kind === "night");
              const summaryLine = summarizeRecovery(morning, night);
              const daySummary = summaryByDay.get(dayKey);

              return (
                <section key={dayKey} className="space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-xs text-gray-500">日付</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {formatDayKey(dayKey)}
                      </div>
                    </div>
                    {summaryLine && (
                      <div className="ui-pill">{summaryLine}</div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-5">
                    <div className="text-xs text-gray-500 mb-3">
                      同日の記録（時系列）
                    </div>
                    <div className="space-y-3">
                      {items.map((r) => (
                        <Link
                          key={r.id}
                          href={`/state-check/history/${r.id}`}
                          className="block rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-gray-900">
                              {timeHHMM(r.created_at)} {kindLabel(r.run_kind)}：{r.result_type}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {formatDate(r.created_at)}
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
                            <span>推進 {r.propulsion_score}</span>
                            <span>消耗 {r.fatigue_score}</span>
                            <span>迷い {r.confusion_score}</span>
                            <span>回復 {r.recovery_score}</span>
                            <span>熱量 {r.heat_score}</span>
                          </div>
                          <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                            {snippet(r.note_text ?? null)}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <DaySummaryEditor
                    dayKey={dayKey}
                    initial={
                      daySummary
                        ? {
                            drift_text: daySummary.drift_text ?? null,
                            recovered_text: daySummary.recovered_text ?? null,
                            tomorrow_step_text: daySummary.tomorrow_step_text ?? null,
                          }
                        : undefined
                    }
                  />
                </section>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

