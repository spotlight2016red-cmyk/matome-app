import Link from "next/link";
import { getDiagnosisRun } from "@/app/state-check/_server/diagnosisRepo";

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

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

export default async function StateCheckHistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await getDiagnosisRun(id);

  return (
    <div className="size-full min-h-screen bg-white px-5 py-10 sm:px-8 sm:py-14 md:px-16">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/state-check/history"
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline underline-offset-2"
          >
            ← 履歴一覧へ
          </Link>
          <Link
            href="/state-check"
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline underline-offset-2"
          >
            診断へ
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
          <div className="text-xs text-gray-500 mb-1">詳細</div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide text-gray-900">
            {run.result_type}
          </h1>
          <div className="mt-2 text-[11px] text-gray-500">
            {formatDate(run.created_at)}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-gray-600">
            <span>推進 {run.propulsion_score}</span>
            <span>消耗 {run.fatigue_score}</span>
            <span>迷い {run.confusion_score}</span>
            <span>回復 {run.recovery_score}</span>
            <span>熱量 {run.heat_score}</span>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl bg-gray-900 text-white px-6 py-6">
            <div className="text-xs font-semibold text-white/80 mb-1">次の一手</div>
            <div className="text-sm sm:text-base leading-relaxed">
              {run.primary_action}
            </div>
          </div>

          <details className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
            <summary className="cursor-pointer select-none text-sm font-semibold text-gray-900">
              詳細を見る（補足）
            </summary>

            <div className="mt-4 space-y-4">
              {(run.heat_mode_title || run.heat_mode_body) && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-6">
                  <div className="text-xs font-semibold text-amber-800 mb-1">
                    {run.heat_mode_title ?? "熱の活かし方"}
                  </div>
                  {run.heat_mode_body && (
                    <div className="text-sm sm:text-base text-gray-900 leading-relaxed mb-3">
                      {run.heat_mode_body}
                    </div>
                  )}
                  {asStringArray(run.heat_mode_actions_json).length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base text-gray-900">
                      {asStringArray(run.heat_mode_actions_json).map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  状態説明
                </div>
                <div className="text-sm sm:text-base text-gray-900 leading-relaxed">
                  {run.result_summary}
                </div>
              </div>

              {asStringArray(run.recovery_actions_json).length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6">
                  <div className="text-xs font-semibold text-gray-600 mb-2">
                    戻す行動（候補）
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base text-gray-900">
                    {asStringArray(run.recovery_actions_json).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-6">
            <div className="text-xs font-semibold text-gray-600 mb-2">
              追加メモ
            </div>
            <div className="text-sm sm:text-base text-gray-900 leading-relaxed whitespace-pre-wrap">
              {(run.note_text ?? "").trim() || "（メモなし）"}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-6">
            <div className="text-xs font-semibold text-gray-600 mb-2">
              回答（JSON）
            </div>
            <pre className="text-xs text-gray-800 overflow-x-auto">
{JSON.stringify(run.answers_json, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

