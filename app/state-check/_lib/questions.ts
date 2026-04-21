import type { Question } from "./types";

export const STATE_CHECK_QUESTIONS: readonly Question[] = [
  {
    id: "q1_money",
    title: "Q1. お金の安心感",
    options: [
      {
        id: "a",
        label: "しばらく大丈夫",
        add: { propulsion: 2, confusion: 0, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "b",
        label: "少し不安",
        add: { propulsion: 0, confusion: 1, exhaustion: 0, recoveryNeed: 1 },
      },
      {
        id: "c",
        label: "かなり不安",
        add: { propulsion: 0, confusion: 2, exhaustion: 1, recoveryNeed: 2 },
        signals: { moneyAnxiety: true },
      },
    ],
  },
  {
    id: "q2_clarity",
    title: "Q2. 頭の整理度",
    options: [
      {
        id: "a",
        label: "かなり整理できている",
        add: { propulsion: 2, confusion: 0, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "b",
        label: "ある程度見えている",
        add: { propulsion: 1, confusion: 1, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "c",
        label: "ごちゃついている",
        add: { propulsion: 0, confusion: 2, exhaustion: 1, recoveryNeed: 1 },
      },
    ],
  },
  {
    id: "q3_meaning",
    title: "Q3. 今やっていることの意味",
    options: [
      {
        id: "a",
        label: "かなり腹落ちしている",
        add: { propulsion: 2, confusion: 0, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "b",
        label: "まあ分かる",
        add: { propulsion: 1, confusion: 1, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "c",
        label: "義務感が強い",
        add: { propulsion: 0, confusion: 1, exhaustion: 2, recoveryNeed: 1 },
        signals: { meaningLow: true },
      },
    ],
  },
  {
    id: "q4_relationship",
    title: "Q4. 人間関係・依頼相手の質",
    options: [
      {
        id: "a",
        label: "信頼できる",
        add: { propulsion: 2, confusion: 0, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "b",
        label: "普通",
        add: { propulsion: 1, confusion: 1, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "c",
        label: "圧がある / 曖昧",
        add: { propulsion: 0, confusion: 2, exhaustion: 2, recoveryNeed: 1 },
        signals: { relationshipPressure: true },
      },
    ],
  },
  {
    id: "q5_energy",
    title: "Q5. 体力・回復度",
    options: [
      {
        id: "a",
        label: "元気",
        add: { propulsion: 2, confusion: 0, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "b",
        label: "少し疲れている",
        add: { propulsion: 0, confusion: 0, exhaustion: 1, recoveryNeed: 1 },
      },
      {
        id: "c",
        label: "かなり疲れている",
        add: { propulsion: 0, confusion: 1, exhaustion: 2, recoveryNeed: 3 },
        signals: { lowEnergy: true },
      },
    ],
  },
  {
    id: "q6_next",
    title: "Q6. 次の一手の明確さ",
    options: [
      {
        id: "a",
        label: "1つに絞れている",
        add: { propulsion: 2, confusion: 0, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "b",
        label: "2〜3個ある",
        add: { propulsion: 1, confusion: 1, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "c",
        label: "多すぎて決められない",
        add: { propulsion: 0, confusion: 3, exhaustion: 1, recoveryNeed: 1 },
        signals: { optionsTooMany: true },
      },
    ],
  },
  {
    id: "q7_honesty",
    title: "Q7. 本音を言えているか",
    options: [
      {
        id: "a",
        label: "言えている",
        add: { propulsion: 2, confusion: 0, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "b",
        label: "一部は我慢している",
        add: { propulsion: 0, confusion: 1, exhaustion: 1, recoveryNeed: 0 },
      },
      {
        id: "c",
        label: "かなり飲み込んでいる",
        add: { propulsion: 0, confusion: 2, exhaustion: 2, recoveryNeed: 1 },
        signals: { suppressHonesty: true },
      },
    ],
  },
  {
    id: "q8_heat",
    title: "Q8. 今の熱量",
    options: [
      {
        id: "a",
        label: "かなり乗っている",
        add: { heat: 3, propulsion: 1, confusion: 0, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "b",
        label: "まあある",
        add: { heat: 2, propulsion: 0, confusion: 0, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "c",
        label: "普通",
        add: { heat: 1, propulsion: 0, confusion: 0, exhaustion: 0, recoveryNeed: 0 },
      },
      {
        id: "d",
        label: "低い",
        add: { heat: 0, propulsion: 0, confusion: 0, exhaustion: 0, recoveryNeed: 1 },
      },
    ],
  },
] as const;

