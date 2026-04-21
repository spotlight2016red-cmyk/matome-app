import Link from "next/link";
import { listDiagnosisRuns } from "@/app/state-check/_server/diagnosisRepo";

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

export default async function StateCheckHistoryPage() {
  const runs = await listDiagnosisRuns({ limit: 50 });

  return (
    <div className="size-full min-h-screen bg-white px-5 py-10 sm:px-8 sm:py-14 md:px-16">
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
          <div className="space-y-3">
            {runs.map((r) => (
              <Link
                key={r.id}
                href={`/state-check/history/${r.id}`}
                className="block rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-5 hover:bg-gray-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-base font-semibold text-gray-900">
                    {r.result_type}
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
                  {snippet((r as any).note_text ?? null)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

