export type AvatarStage = {
  level: 1 | 2 | 3 | 4 | 5;
  key: "seed" | "sprout" | "sapling" | "tree" | "bloom";
  label: string;
  emoji: string;
  message: string;
};

export const avatarStages: AvatarStage[] = [
  {
    level: 1,
    key: "seed",
    label: "種 / はじまり",
    emoji: "🌱",
    message: "まずは1回の記録。小さく始めるほど、続きます。",
  },
  {
    level: 2,
    key: "sprout",
    label: "芽 / 整えはじめ",
    emoji: "🌿",
    message: "整えはじめ。気づきを増やすほど再現性が上がります。",
  },
  {
    level: 3,
    key: "sapling",
    label: "若木 / 自分攻略中",
    emoji: "🌳",
    message: "自分攻略中。傾向が見え始めて、打ち手が当たりやすくなります。",
  },
  {
    level: 4,
    key: "tree",
    label: "木 / 方程式を育てる人",
    emoji: "🌲",
    message: "方程式を育てる人。戻し方・整え方が言語化されてきます。",
  },
  {
    level: 5,
    key: "bloom",
    label: "開花 / 取扱説明書が育っている",
    emoji: "🌸",
    message: "取扱説明書が育っている。記録がそのまま武器になります。",
  },
];

export function stageFromLevel(level: number): AvatarStage {
  const l = Math.max(1, Math.min(5, Math.floor(level))) as 1 | 2 | 3 | 4 | 5;
  return avatarStages[l - 1]!;
}

