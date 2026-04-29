"use client";

import * as React from "react";
import { stageFromLevel } from "@/app/lib/avatarStages";
import {
  getAvatarFallbackImage,
  getAvatarImageCandidates,
  type AvatarType,
} from "@/app/lib/avatarImage";

export function AvatarStatusCard({
  avatarType,
  level,
  points,
  nextLevelAt,
  className,
}: {
  avatarType?: AvatarType;
  level: number;
  points: number;
  nextLevelAt: number;
  className?: string;
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
        "px-6 py-6 sm:px-8 sm:py-8",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className={[
            "rounded-full bg-white border border-gray-200 overflow-hidden shadow-lg ring-2 ring-gray-100",
            // mobile: 120-150px, desktop: 180-220px
            "size-[132px] sm:size-[180px] lg:size-[208px]",
          ].join(" ")}
        >
          <img
            src={imgSrc}
            alt={`avatar_${avatarType ?? "explorer"}_lv${Math.max(1, Math.floor(level))}`}
            className="size-full object-cover"
            width={208}
            height={208}
            onError={() => {
              const nextIdx = idxRef.current + 1;
              idxRef.current = nextIdx;
              const next = candidates[nextIdx];
              setImgSrc(next ?? fallbackSrc);
            }}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="ui-pill ui-pill-hero">Lv.{Math.max(1, Math.floor(level))}</span>
          <span className="ui-pill">{points}pt</span>
          {level >= 6 ? (
            <span className="ui-pill">神化</span>
          ) : (
            <span className="ui-pill">次まで {remain}pt</span>
          )}
        </div>

        <div className="mt-3 text-base sm:text-lg font-semibold text-gray-900">
          {stage.label}
        </div>

        <p className="mt-2 text-sm sm:text-base text-gray-700 leading-relaxed max-w-[32rem]">
          記録が増えるほど、自分の攻略法が育っていきます。
        </p>
      </div>
    </section>
  );
}

