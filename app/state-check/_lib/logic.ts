import { STATE_CHECK_QUESTIONS } from "./questions";
import { STATE_CHECK_RESULTS } from "./results";
import type {
  AnswerMap,
  AxisKey,
  AxisScores,
  StateCheckResult,
  StateCheckResultId,
} from "./types";

const AXES: readonly AxisKey[] = [
  "propulsion",
  "exhaustion",
  "confusion",
  "recoveryNeed",
  "heat",
];

export function emptyScores(): AxisScores {
  return {
    propulsion: 0,
    exhaustion: 0,
    confusion: 0,
    recoveryNeed: 0,
    heat: 0,
  };
}

export type StateCheckComputation = {
  scores: AxisScores;
  result: StateCheckResult;
  heatMode: null | {
    title: string;
    body: string;
    actions: string[];
  };
  debug: {
    chosenId: StateCheckResultId;
    signals: Record<string, boolean>;
  };
};

function addScore(out: AxisScores, add: Partial<AxisScores>) {
  for (const k of AXES) out[k] += add[k] ?? 0;
}

/**
 * 実用重視の「状態診断」判定。
 * - まず回復が必要な状態を優先して拾う（休む/減らすが最優先のときは行動提案も変わるため）
 * - 次に消耗・防御・本音圧縮など“詰まり”を拾う
 * - 最後に前進・突破・安定・熱量拡散を振り分ける
 */
export function computeStateCheck(answers: AnswerMap): StateCheckComputation {
  const scores = emptyScores();

  const signals: Record<string, boolean> = {
    moneyAnxiety: false,
    relationshipPressure: false,
    lowEnergy: false,
    optionsTooMany: false,
    suppressHonesty: false,
    meaningLow: false,
  };

  for (const q of STATE_CHECK_QUESTIONS) {
    const choice = answers[q.id];
    if (!choice) continue;
    const opt = q.options.find((o) => o.id === choice);
    if (!opt) continue;
    addScore(scores, opt.add);
    if (opt.signals) {
      for (const [k, v] of Object.entries(opt.signals)) {
        if (v) signals[k] = true;
      }
    }
  }

  // ざっくり閾値（7問×最大3点を前提に、実用的に「強い状態」を拾う）
  const highRecovery = scores.recoveryNeed >= 7 || (signals.lowEnergy && scores.recoveryNeed >= 6);
  const highExhaustion = scores.exhaustion >= 7;
  const highConfusion = scores.confusion >= 7;
  const highPropulsion = scores.propulsion >= 9;
  const midPropulsion = scores.propulsion >= 6;
  const heatHigh = scores.heat >= 3;

  let chosen: StateCheckResultId;

  // 1) 休息・立て直し最優先
  if (highRecovery) {
    chosen = "recovery-lack";
  } else if (highExhaustion && scores.recoveryNeed >= 4) {
    chosen = "burnout-accumulate";
  } else if (
    (signals.moneyAnxiety || signals.relationshipPressure) &&
    (scores.confusion >= 5 || scores.exhaustion >= 5)
  ) {
    // 2) 不安/圧が強く、守りに入りやすい
    chosen = "defense-first";
  } else if (signals.suppressHonesty && (scores.exhaustion >= 4 || scores.confusion >= 4)) {
    // 3) 本音が詰まって内側で重くなる
    chosen = "honesty-compress";
  } else if (signals.optionsTooMany && (highConfusion || (midPropulsion && scores.confusion >= 6))) {
    // 4) 熱量はあるが選択肢過多で分散
    chosen = "heat-diffuse";
  } else if (highPropulsion && scores.exhaustion <= 3 && scores.confusion <= 3) {
    // 5) 使命前進（最もスムーズ）
    chosen = "mission-forward";
  } else if (
    highPropulsion &&
    scores.confusion <= 5 &&
    scores.exhaustion <= 5 &&
    // 「適度な緊張感」っぽさ：関係が“完璧に安心”ではない時に集中モードへ寄せる
    !signals.relationshipPressure
  ) {
    // 6) 集中突破（成果に直結する一点集中の提案が効く）
    chosen = "focus-breakthrough";
  } else if (!highConfusion && scores.exhaustion <= 4 && midPropulsion) {
    // 7) 安定構築（積み上げで伸びる）
    chosen = "stable-build";
  } else if (scores.exhaustion >= 6) {
    // 最後の拾い：消耗が目立つ
    chosen = "burnout-accumulate";
  } else {
    // 迷い寄りは熱量拡散、そうでなければ安定構築に着地
    chosen = highConfusion ? "heat-diffuse" : "stable-build";
  }

  return {
    scores,
    result: STATE_CHECK_RESULTS[chosen],
    heatMode: deriveHeatMode({ heatHigh, propulsion: scores.propulsion, confusion: scores.confusion }),
    debug: {
      chosenId: chosen,
      signals,
    },
  };
}

function deriveHeatMode(input: {
  heatHigh: boolean;
  propulsion: number;
  confusion: number;
}): StateCheckComputation["heatMode"] {
  if (!input.heatHigh) return null;

  // 熱が高い時だけ補足カードを出す（本人の“熱の使い方”に繋げる）
  const propulsionHigh = input.propulsion >= 9;
  const confusionHigh = input.confusion >= 7;

  if (propulsionHigh && !confusionHigh) {
    return {
      title: "今は一気に進めるチャンスです",
      body:
        "熱がある今のうちに、単発で頑張るだけでなく、次の自分が迷わないように、下書き・素材・次の工程まで仕込んでおくと前に進みやすくなります。",
      actions: [
        "下書きを先に作る",
        "次の工程を書き出す",
        "未来の自分向けメモを残す",
        "1つは完成形に近づける",
      ],
    };
  }

  if (confusionHigh) {
    return {
      title: "熱はあります。広げすぎ注意です",
      body:
        "いまは動ける状態ですが、同時に色々広げすぎると未完了が増えて後で重くなりやすいです。まず1つ締めることを優先してください。",
      actions: [
        "今日やることを1つに絞る",
        "新しい案はメモに逃がす",
        "1件終わらせてから次に行く",
      ],
    };
  }

  return null;
}

export function isAllAnswered(answers: AnswerMap): boolean {
  return STATE_CHECK_QUESTIONS.every((q) => Boolean(answers[q.id]));
}

