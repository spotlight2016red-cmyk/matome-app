export type AxisKey = "propulsion" | "exhaustion" | "confusion" | "recoveryNeed";

export type AxisScores = Record<AxisKey, number>;

export type QuestionOptionId = "a" | "b" | "c";

export type QuestionOption = {
  id: QuestionOptionId;
  label: string;
  /**
   * 実用重視のスコアリング。
   * - 良い回答 → 推進力（propulsion）を上げる
   * - 不安や曖昧さ → 迷い度（confusion）を上げる
   * - 圧・疲労・本音を飲み込む → 消耗度（exhaustion）を上げる
   * - 疲労やかなり不安 → 回復必要度（recoveryNeed）を上げる
   */
  add: Partial<AxisScores>;
  /**
   * 8パターンへの振り分けを「自然」にするための補助フラグ。
   * （心理学の正確さより、行動に落とす実用性を優先）
   */
  signals?: Partial<{
    moneyAnxiety: boolean;
    relationshipPressure: boolean;
    lowEnergy: boolean;
    optionsTooMany: boolean;
    suppressHonesty: boolean;
    meaningLow: boolean;
  }>;
};

export type Question = {
  id: string;
  title: string;
  options: readonly [QuestionOption, QuestionOption, QuestionOption];
};

export type AnswerMap = Record<string, QuestionOptionId | undefined>;

export type StateCheckResultId =
  | "mission-forward"
  | "focus-breakthrough"
  | "stable-build"
  | "heat-diffuse"
  | "defense-first"
  | "burnout-accumulate"
  | "recovery-lack"
  | "honesty-compress";

export type StateCheckResult = {
  id: StateCheckResultId;
  name: string;
  description: string;
  formula: string;
  likely: readonly string[];
  nextStep: string;
};

