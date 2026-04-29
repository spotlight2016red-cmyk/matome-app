"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/app/lib/supabase/browser";
import { levelFromPoints, totalPoints } from "@/app/state-check/_lib/points";
import type { DiagnosisRunSummary } from "@/app/state-check/_components/HistoryList";
import { AvatarGrowthCard } from "@/app/components/AvatarGrowthCard";

export function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [history, setHistory] = React.useState<DiagnosisRunSummary[]>([]);
  const [serverPoints, setServerPoints] = React.useState<number | null>(null);
  const [gain, setGain] = React.useState<number | null>(null);

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
          setHistory([]);
          setServerPoints(null);
          return;
        }
        const [runsRes, pointsRes] = await Promise.all([
          fetch("/api/diagnosis", { method: "GET" }),
          fetch("/api/points", { method: "GET" }),
        ]);
        const runsJson = (await runsRes.json()) as any;
        const pointsJson = (await pointsRes.json()) as any;
        if (!mounted) return;
        if (runsJson?.ok) setHistory(runsJson.runs ?? []);
        if (pointsJson?.ok) setServerPoints(Number(pointsJson.points ?? 0));
      } catch {
        if (!mounted) return;
        setAuthed(false);
        setHistory([]);
        setServerPoints(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    const raw = searchParams.get("gained");
    if (!raw) return;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return;
    setGain(Math.floor(n));
    const t = window.setTimeout(() => setGain(null), 1400);
    // Clean up URL to avoid showing again on refresh.
    router.replace("/home");
    return () => window.clearTimeout(t);
  }, [router, searchParams]);

  const points = React.useMemo(() => {
    if (typeof serverPoints === "number") return serverPoints;
    return totalPoints(history);
  }, [history, serverPoints]);
  const { level, nextLevelAt } = React.useMemo(
    () => levelFromPoints(points),
    [points]
  );

  return (
    <div className="mb-6">
      {authed === false ? (
        <div className="rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur px-6 py-6 text-sm text-gray-700">
          ログインすると、ポイント/レベルとアバター成長が有効になります。
        </div>
      ) : (
        <div className="space-y-3">
          {gain && (
            <div className="text-sm font-semibold text-emerald-900">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
                +{gain}pt
              </span>
            </div>
          )}
          <AvatarGrowthCard
            level={level}
            points={points}
            nextLevelAt={nextLevelAt}
          />
        </div>
      )}
    </div>
  );
}

