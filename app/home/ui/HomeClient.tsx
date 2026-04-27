"use client";

import * as React from "react";
import { supabaseBrowser } from "@/app/lib/supabase/browser";
import { levelFromPoints, totalPoints } from "@/app/state-check/_lib/points";
import type { DiagnosisRunSummary } from "@/app/state-check/_components/HistoryList";
import { AvatarGrowthCard } from "@/app/components/AvatarGrowthCard";

export function HomeClient() {
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [history, setHistory] = React.useState<DiagnosisRunSummary[]>([]);

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
          return;
        }
        const res = await fetch("/api/diagnosis", { method: "GET" });
        const json = (await res.json()) as any;
        if (!mounted) return;
        if (json?.ok) setHistory(json.runs ?? []);
      } catch {
        if (!mounted) return;
        setAuthed(false);
        setHistory([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const points = React.useMemo(() => totalPoints(history), [history]);
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
        <AvatarGrowthCard
          level={level}
          points={points}
          nextLevelAt={nextLevelAt}
        />
      )}
    </div>
  );
}

