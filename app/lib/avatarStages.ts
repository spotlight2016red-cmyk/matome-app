export type AvatarStage = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  label: string;
  message: string;
};

export const avatarStages: AvatarStage[] = [
  {
    level: 1,
    label: "はじまり",
    message: "まずは1回の記録。小さく始めるほど、続きます。",
  },
  {
    level: 2,
    label: "整えはじめ",
    message: "整えはじめ。気づきを増やすほど再現性が上がります。",
  },
  {
    level: 3,
    label: "自分攻略中",
    message: "自分攻略中。傾向が見え始めて、打ち手が当たりやすくなります。",
  },
  {
    level: 4,
    label: "方程式を育てる人",
    message: "方程式を育てる人。戻し方・整え方が言語化されてきます。",
  },
  {
    level: 5,
    label: "取扱説明書が育っている",
    message: "取扱説明書が育っている。記録がそのまま武器になります。",
  },
  {
    level: 6,
    label: "神化",
    message: "攻略法が定着。迷いを減らすための仕組みが自分の中にあります。",
  },
];

export function stageFromLevel(level: number): AvatarStage {
  const l = Math.max(1, Math.min(6, Math.floor(level))) as 1 | 2 | 3 | 4 | 5 | 6;
  return avatarStages[l - 1]!;
}

