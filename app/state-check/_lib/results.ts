import type { StateCheckResult, StateCheckResultId } from "./types";

export const STATE_CHECK_RESULTS: Record<StateCheckResultId, StateCheckResult> = {
  "mission-forward": {
    id: "mission-forward",
    name: "使命前進型",
    description:
      "意味も見えていて、前に進む力があります。いまは動くことで流れが良くなりやすい状態です。",
    formula:
      "◎ 意味 × ○ 整理 × ○ 行動明確 × ○ 信頼関係 ＝ 前進しやすい状態",
    likely: ["行動が進む", "周囲を巻き込みやすい", "発信や提案に力が乗る"],
    nextStep: "迷う前に、今日の一歩を具体化する",
  },
  "focus-breakthrough": {
    id: "focus-breakthrough",
    name: "集中突破型",
    description:
      "役割と目的が噛み合うと、一気に集中して突破しやすい状態です。",
    formula: "◎ 目的共有 × ○ 役割明確 × △ 適度な緊張感 ＝ 集中しやすい状態",
    likely: ["現場で力を発揮しやすい", "判断が早くなる", "短期間で結果が出やすい"],
    nextStep: "今いちばん成果につながる1件に集中する",
  },
  "stable-build": {
    id: "stable-build",
    name: "安定構築型",
    description:
      "大きく跳ねるというより、着実に積み上げるのに向いている状態です。",
    formula: "○ 安心感 × ○ 整理 × ○ 小さな行動 ＝ 安定しながら伸びる状態",
    likely: ["無理なく継続できる", "小さな改善が積み上がる", "焦りに飲まれにくい"],
    nextStep: "大きな成果より、継続できる形を優先する",
  },
  "heat-diffuse": {
    id: "heat-diffuse",
    name: "熱量拡散型",
    description:
      "想いはあるのに、方向が増えすぎて力が分散しやすい状態です。",
    formula: "◎ 熱量 × ■ 選択肢過多 × × 絞り込み不足 ＝ 空回りしやすい状態",
    likely: ["新しい案は出る", "でも着地しにくい", "終わった感が薄くなる"],
    nextStep: "今日やることを1つに絞る",
  },
  "defense-first": {
    id: "defense-first",
    name: "防御優先型",
    description:
      "前進よりも、まず傷つかないことを優先しやすい状態です。",
    formula: "■ 不安 × × 圧のある関係 × △ 本音の抑制 ＝ 守りに入りやすい状態",
    likely: ["判断が慎重になる", "本音が出しづらい", "行動が止まりやすい"],
    nextStep: "圧の強いものを1つ切り分ける",
  },
  "burnout-accumulate": {
    id: "burnout-accumulate",
    name: "消耗蓄積型",
    description:
      "気づかないうちに疲れやストレスが積み重なっている状態です。",
    formula: "■ 疲労 × ■ 我慢 × × 回復不足 ＝ 消耗しやすい状態",
    likely: ["些細なことで重くなる", "気分転換が雑になりやすい", "自己否定が増えやすい"],
    nextStep: "まず回復を予定に入れる",
  },
  "recovery-lack": {
    id: "recovery-lack",
    name: "回復不足型",
    description:
      "判断や努力より先に、休息と整え直しが必要な状態です。",
    formula: "■ 体力低下 × ■ 集中力低下 × △ 無理な継続 ＝ 立て直し優先の状態",
    likely: ["うまく考えられない", "決めきれない", "小さなことでも負荷が大きい"],
    nextStep: "今日は増やさず、減らす判断をする",
  },
  "honesty-compress": {
    id: "honesty-compress",
    name: "本音圧縮型",
    description:
      "本当は感じていることがあるのに、うまく外に出せず内側で詰まりやすい状態です。",
    formula:
      "△ 表面上の安定 × × 本音の抑圧 × ■ 違和感の蓄積 ＝ 内側で詰まりやすい状態",
    likely: ["後からモヤモヤする", "相手に合わせすぎる", "急にしんどくなる"],
    nextStep: "まずは本音を一言だけ書き出す",
  },
};

