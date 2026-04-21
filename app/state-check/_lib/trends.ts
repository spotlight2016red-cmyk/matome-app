import type { StateCheckHistoryEntryV1 } from "./types";
import { STATE_CHECK_RESULTS } from "./results";

export type StateCheckTrends = {
  recentTendencies: string[];
  recoveryStyles: string[];
};

function topKeys(
  counts: Record<string, number>,
  opts?: { minCount?: number; limit?: number }
) {
  const minCount = opts?.minCount ?? 2;
  const limit = opts?.limit ?? 3;
  return Object.entries(counts)
    .filter(([, c]) => c >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

/**
 * 直近の履歴から「最近の傾向」と「自分に合う戻し方」を生成する。
 * 厳密な統計ではなく、本人が“使える言葉”になることを優先。
 */
export function deriveTrends(
  history: StateCheckHistoryEntryV1[],
  opts?: { windowSize?: number }
): StateCheckTrends {
  const windowSize = opts?.windowSize ?? 12;
  const recent = history.slice(0, windowSize);
  if (recent.length === 0) return { recentTendencies: [], recoveryStyles: [] };

  const tendencyCounts: Record<string, number> = {};
  const recoveryCounts: Record<string, number> = {};

  for (const h of recent) {
    if (h.signals.relationshipPressure) {
      tendencyCounts["曖昧な依頼や圧があると、消耗しやすい"] =
        (tendencyCounts["曖昧な依頼や圧があると、消耗しやすい"] ?? 0) + 1;
    }
    if (h.signals.lowEnergy) {
      tendencyCounts["疲れている時は、判断が鈍りやすい"] =
        (tendencyCounts["疲れている時は、判断が鈍りやすい"] ?? 0) + 1;
    }
    if (h.signals.suppressHonesty) {
      tendencyCounts["疲れている時ほど、本音を飲み込みやすい"] =
        (tendencyCounts["疲れている時ほど、本音を飲み込みやすい"] ?? 0) + 1;
    }
    if (h.signals.optionsTooMany) {
      tendencyCounts["選択肢が増えると、迷いが膨らみやすい"] =
        (tendencyCounts["選択肢が増えると、迷いが膨らみやすい"] ?? 0) + 1;
    }
    if (h.signals.meaningLow) {
      tendencyCounts["意味が腹落ちしない時は、義務感で消耗しやすい"] =
        (tendencyCounts["意味が腹落ちしない時は、義務感で消耗しやすい"] ?? 0) + 1;
    }
    if (h.signals.moneyAnxiety) {
      tendencyCounts["お金の不安が強い時は、防御モードに入りやすい"] =
        (tendencyCounts["お金の不安が強い時は、防御モードに入りやすい"] ?? 0) + 1;
    }

    // 戻し方（nextStep / quickActions の頻度）
    const result = STATE_CHECK_RESULTS[h.resultId];
    if (result) {
      recoveryCounts[result.nextStep] = (recoveryCounts[result.nextStep] ?? 0) + 1;
      for (const qa of result.quickActions) {
        recoveryCounts[qa] = (recoveryCounts[qa] ?? 0) + 1;
      }
    }
  }

  const recentTendencies = topKeys(tendencyCounts, { minCount: 2, limit: 3 });
  const recoveryStyles = topKeys(recoveryCounts, { minCount: 2, limit: 3 });

  return { recentTendencies, recoveryStyles };
}

