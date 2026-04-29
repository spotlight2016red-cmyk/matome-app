export type AvatarStage = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  key: "avatar_1" | "avatar_2" | "avatar_3" | "avatar_4" | "avatar_5" | "avatar_6";
  label: string;
  imageSrc: string;
  message: string;
};

export const avatarStages: AvatarStage[] = [
  {
    level: 1,
    key: "avatar_1",
    label: "はじまり",
    imageSrc: "/avatars/avatar_1.svg",
    message: "まずは1回の記録。小さく始めるほど、続きます。",
  },
  {
    level: 2,
    key: "avatar_2",
    label: "整えはじめ",
    imageSrc: "/avatars/avatar_2.svg",
    message: "整えはじめ。気づきを増やすほど再現性が上がります。",
  },
  {
    level: 3,
    key: "avatar_3",
    label: "自分攻略中",
    imageSrc: "/avatars/avatar_3.svg",
    message: "自分攻略中。傾向が見え始めて、打ち手が当たりやすくなります。",
  },
  {
    level: 4,
    key: "avatar_4",
    label: "方程式を育てる人",
    imageSrc: "/avatars/avatar_4.svg",
    message: "方程式を育てる人。戻し方・整え方が言語化されてきます。",
  },
  {
    level: 5,
    key: "avatar_5",
    label: "取扱説明書が育っている",
    imageSrc: "/avatars/avatar_5.svg",
    message: "取扱説明書が育っている。記録がそのまま武器になります。",
  },
  {
    level: 6,
    key: "avatar_6",
    label: "マスター",
    imageSrc: "/avatars/avatar_6.svg",
    message: "攻略法が定着。迷いを減らすための仕組みが自分の中にあります。",
  },
];

export function stageFromLevel(level: number): AvatarStage {
  const l = Math.max(1, Math.min(6, Math.floor(level))) as 1 | 2 | 3 | 4 | 5 | 6;
  return avatarStages[l - 1]!;
}

