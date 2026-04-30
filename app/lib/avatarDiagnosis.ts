/**
 * 初回／再診断のアバター診断（設問・採点・タイプ表示）。
 * - 再診断 URL: `avatarDiagnosisRedoHref(nextPath)`
 * - タイプ別コピー: `AVATAR_TYPE_RESULT_COPY`（マイページの概要・ツールチップ等に転用可）
 */

import type { AvatarType } from "@/app/lib/avatarImage";

/** 結果画面の本文（特徴 2〜3 行・攻略ポイント・初回 NextMove ヒント） */
export const AVATAR_TYPE_RESULT_COPY: Record<
  AvatarType,
  {
    label: string;
    traitLines: readonly string[];
    strategyBullets: readonly string[];
    /** 状態チェック前でも使える「次の一手」相当の短文 */
    suggestedFirstMove: string;
  }
> = {
  guide: {
    label: "導き手",
    traitLines: [
      "迷いの中でも、次に取るべき一手が見えやすいタイプです。",
      "人や場の「方向」と「優先順位」を言語化するのが得意で、動き出すきっかけを作れます。",
      "背中をそっと押すと、周りが自然と前に進み始めます。",
    ],
    strategyBullets: [
      "動く前に「目的」と「いつまでに」を一言で決めると強い。",
      "選択肢が多いときは「今日はこれだけ」と一本に絞る。",
      "提案は短く。相手のペースを待ちすぎず、次の一歩を具体的に示す。",
    ],
    suggestedFirstMove: "いまの状態を一言で書き出し、「今日の最優先の一手」だけをひとつ選ぶ。",
  },
  healer: {
    label: "癒し手",
    traitLines: [
      "空気の張りや感情の揺れに敏感で、場をやわらかく整えられるタイプです。",
      "休む・整える・認めるを通して、続けられるペースをつくるのが得意です。",
      "人が安心して戻ってこられる「居場所」をつくれます。",
    ],
    strategyBullets: [
      "まず身体と心の負荷を下げる（睡眠・休憩・依頼の減らし方）から入ると強い。",
      "「大丈夫？」より「いま一番しんどいのはどこ？」と聞き方を具体化する。",
      "自分にも同じ優しさを。燃え尽きないよう境界線を決める。",
    ],
    suggestedFirstMove: "今日の終わりに「よかったこと」を1つだけ書き留めて、自分を先に癒す。",
  },
  guardian: {
    label: "守り手",
    traitLines: [
      "リスクや抜け漏れを早めに察知し、土台を固めるのが得意なタイプです。",
      "ルール・手順・環境を整えて、「事故らない進み方」を設計できます。",
      "静かな安心感で、チームの持続力を支えられます。",
    ],
    strategyBullets: [
      "着手前に「失敗パターン」と「守るべきライン」を3つまで挙げると強い。",
      "チェックリスト化・担当割りで抜けを減らす。",
      "変化が激しいときほど、最小限の「守り」を先に固定する。",
    ],
    suggestedFirstMove: "いまのタスクを「守る・任せる・やめる」に分けて、やめるを1つ決める。",
  },
  explorer: {
    label: "探求者",
    traitLines: [
      "情報を集め、試しながら学ぶことで突破口を見つけるタイプです。",
      "正解が一つに決まらない局面ほど、好奇心と仮説が火を吹きます。",
      "小さな実験の繰り返しで、地図のない場所でも進められます。",
    ],
    strategyBullets: [
      "「試す条件」と「やめる条件」をセットで決めると強い。",
      "15分だけ調べる／1人に聞く、など時間と回数を区切る。",
      "失敗をログとして残し、次の仮説に変える。",
    ],
    suggestedFirstMove: "気になることを1つだけピックし、検索か聞き取りのどちらかで15分だけ調べる。",
  },
  transformer: {
    label: "変革者",
    traitLines: [
      "いまのやり方を分解して、組み替えて再現しやすくするのが得意なタイプです。",
      "「当たり前」を疑い、仕組みや前提を入れ替えて成果を出せます。",
      "カオスな状況ほど、構造化と再設計で立て直せます。",
    ],
    strategyBullets: [
      "まず「いまの流れ」を5ステップ以内で書き出すと強い。",
      "削除・統合・自動化のどれで効くかを優先順位づけする。",
      "変化は小さく始め、効いたところから横展開する。",
    ],
    suggestedFirstMove: "いまの手順を箇条書きにして、「削れる1ステップ」を見つける。",
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
