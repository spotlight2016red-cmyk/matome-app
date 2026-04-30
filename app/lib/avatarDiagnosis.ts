/**
 * 初回／再診断のアバター診断（設問・採点・タイプ表示）。
 * マイページ等からの導線は `avatarDiagnosisRedoHref(nextPath)` を使う。
 */

import type { AvatarType } from "@/app/lib/avatarImage";

export const AVATAR_TYPE_META: Record<AvatarType, { label: string; desc: string }> = {
  guide: {
    label: "導き手",
    desc: "方向性を示し、人や場を前に進めるのが得意なタイプ。",
  },
  healer: {
    label: "癒し手",
    desc: "感情や空気を和らげ、休ませるのが得意なタイプ。",
  },
  guardian: {
    label: "守り手",
    desc: "土台や環境を整え、安心と安定を支えるのが得意なタイプ。",
  },
  explorer: {
    label: "探求者",
    desc: "情報を集め、試して新しい発見を広げるのが得意なタイプ。",
  },
  transformer: {
    label: "変革者",
    desc: "仕組みや常識を組み替え、変化を起こすのが得意なタイプ。",
  },
};

export type AvatarDiagnosisQuestion = {
  id: string;
  title: string;
  options: { id: string; label: string; scores: Partial<Record<AvatarType, number>> }[];
};

/** 5問・各選択で該当タイプにスコア加算（同点時は guide → … → transformer の順で優先） */
export const AVATAR_DIAGNOSIS_QUESTIONS: readonly AvatarDiagnosisQuestion[] = [
  {
    id: "q1",
    title: "迷ったとき、まずどうする？",
    options: [
      { id: "a", label: "人に方向性を示したくなる", scores: { guide: 2 } },
      { id: "b", label: "相手の気持ちを感じる", scores: { healer: 2 } },
      { id: "c", label: "安定する方法を考える", scores: { guardian: 2 } },
      { id: "d", label: "情報を集めて試す", scores: { explorer: 2 } },
      { id: "e", label: "今までと違う方法を探す", scores: { transformer: 2 } },
    ],
  },
  {
    id: "q2",
    title: "疲れている人を見ると？",
    options: [
      { id: "a", label: "背中を押したい", scores: { guide: 2 } },
      { id: "b", label: "まず休ませたい", scores: { healer: 2 } },
      { id: "c", label: "環境を整えたい", scores: { guardian: 2 } },
      { id: "d", label: "原因を知りたい", scores: { explorer: 2 } },
      { id: "e", label: "状況を変えたい", scores: { transformer: 2 } },
    ],
  },
  {
    id: "q3",
    title: "得意な動き方は？",
    options: [
      { id: "a", label: "場を前に進める", scores: { guide: 2 } },
      { id: "b", label: "空気を和らげる", scores: { healer: 2 } },
      { id: "c", label: "支える・守る", scores: { guardian: 2 } },
      { id: "d", label: "探す・調べる", scores: { explorer: 2 } },
      { id: "e", label: "壊して作り直す", scores: { transformer: 2 } },
    ],
  },
  {
    id: "q4",
    title: "ワクワクする瞬間は？",
    options: [
      { id: "a", label: "人が動き出す瞬間", scores: { guide: 2 } },
      { id: "b", label: "人が安心する瞬間", scores: { healer: 2 } },
      { id: "c", label: "場が整う瞬間", scores: { guardian: 2 } },
      { id: "d", label: "新しい発見をした瞬間", scores: { explorer: 2 } },
      { id: "e", label: "常識が変わる瞬間", scores: { transformer: 2 } },
    ],
  },
  {
    id: "q5",
    title: "自分らしい役割は？",
    options: [
      { id: "a", label: "導く", scores: { guide: 2 } },
      { id: "b", label: "癒す", scores: { healer: 2 } },
      { id: "c", label: "守る", scores: { guardian: 2 } },
      { id: "d", label: "探る", scores: { explorer: 2 } },
      { id: "e", label: "変える", scores: { transformer: 2 } },
    ],
  },
];

export function computeAvatarDiagnosisResult(answers: Record<string, string>): AvatarType {
  const score: Record<AvatarType, number> = {
    guide: 0,
    healer: 0,
    guardian: 0,
    explorer: 0,
    transformer: 0,
  };
  for (const q of AVATAR_DIAGNOSIS_QUESTIONS) {
    const picked = answers[q.id];
    const opt = q.options.find((o) => o.id === picked);
    if (!opt) continue;
    for (const [k, v] of Object.entries(opt.scores)) {
      score[k as AvatarType] += Number(v ?? 0);
    }
  }
  const order: readonly AvatarType[] = ["guide", "healer", "guardian", "explorer", "transformer"];
  let best: AvatarType = "explorer";
  let bestScore = -1;
  for (const t of order) {
    const s = score[t];
    if (s > bestScore) {
      best = t;
      bestScore = s;
    }
  }
  return best;
}

/** 再診断へ（`next` は保存後の遷移先。マイページは `/home`、state-check なら `/state-check` など） */
export function avatarDiagnosisRedoHref(nextPath: string): string {
  const n = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `/avatar-diagnosis?redo=1&next=${encodeURIComponent(n)}`;
}
