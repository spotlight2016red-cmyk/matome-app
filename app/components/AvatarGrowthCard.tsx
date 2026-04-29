"use client";

import * as React from "react";
import { stageFromLevel } from "@/app/lib/avatarStages";
import {
  getAvatarFallbackImage,
  getAvatarImageCandidates,
  type AvatarType,
} from "@/app/lib/avatarImage";

export function AvatarGrowthCard({
  avatarType,
  level,
  points,
  nextLevelAt,
  className,
  compact,
}: {
  avatarType?: AvatarType;
  level: number;
  points: number;
  nextLevelAt: number;
  className?: string;
  compact?: boolean;
}) {
  const stage = React.useMemo(() => stageFromLevel(level), [level]);
  const remain = Math.max(0, nextLevelAt - points);
  const fallbackSrc = React.useMemo(() => getAvatarFallbackImage(), []);
  const candidates = React.useMemo(
    () => getAvatarImageCandidates(avatarType ?? "explorer", level, { points }),
    [avatarType, level, points]
  );
  const desiredSrc = candidates[0] ?? fallbackSrc;
  const [imgSrc, setImgSrc] = React.useState(desiredSrc);
  const idxRef = React.useRef(0);

  React.useEffect(() => {
    setImgSrc(desiredSrc);
    idxRef.current = 0;
  }, [desiredSrc]);

  return (
    <section
      className={[
        "rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur",
        compact ? "px-4 py-3" : "px-6 py-6",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div className={["shrink-0 rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm", compact ? "size-12" : "size-14"].join(" ")}>
          <img
            src={imgSrc}
            alt={`avatar_${avatarType ?? "explorer"}_lv${Math.max(1, Math.floor(level))}`}
            className="size-full object-cover"
            width={compact ? 48 : 56}
            height={compact ? 48 : 56}
            onError={() => {
              const nextIdx = idxRef.current + 1;
              idxRef.current = nextIdx;
              const next = candidates[nextIdx];
              setImgSrc(next ?? fallbackSrc);
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ui-pill ui-pill-hero">Lv.{Math.max(1, Math.floor(level))}</span>
            <span className="ui-pill">{points}pt</span>
            {level >= 6 ? (
              <span className="ui-pill">神化</span>
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

