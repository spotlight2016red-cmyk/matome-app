"use client";

import * as React from "react";
import { stageFromLevel } from "@/app/lib/avatarStages";

export function AvatarGrowthCard({
  level,
  points,
  nextLevelAt,
  className,
  compact,
}: {
  level: number;
  points: number;
  nextLevelAt: number;
  className?: string;
  compact?: boolean;
}) {
  const stage = React.useMemo(() => stageFromLevel(level), [level]);
  const remain = Math.max(0, nextLevelAt - points);

  return (
    <section
      className={[
        "rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur",
        compact ? "px-4 py-3" : "px-6 py-6",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            "shrink-0 grid place-items-center rounded-2xl text-white",
            "bg-gradient-to-br from-blue-500 to-purple-500",
            compact ? "size-12 text-2xl" : "size-14 text-3xl",
          ].join(" ")}
          aria-hidden
        >
          {stage.emoji}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ui-pill ui-pill-hero">Lv.{Math.max(1, Math.floor(level))}</span>
            <span className="ui-pill">{points}pt</span>
            {level >= 5 ? (
              <span className="ui-pill">最大Lv</span>
            ) : (
              <span className="ui-pill">次まで {remain}pt</span>
            )}
          </div>

          <div className="mt-2 text-sm font-semibold text-gray-900">
            {stage.label}
          </div>
          {!compact && (
            <p className="mt-1 text-sm text-gray-700 leading-relaxed">
              {stage.message}
            </p>
          )}
          {compact && (
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
              記録が増えるほど、自分の攻略法が育っていきます。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

