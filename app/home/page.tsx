import Link from "next/link";
import { HomeClient } from "./ui/HomeClient";

export const metadata = {
  title: "ホーム | 自分診断アプリ",
  description: "自分の状態を記録・蓄積していく診断アプリ。",
};

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50 to-purple-50 px-5 py-10 sm:px-8 sm:py-14 md:px-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs tracking-widest text-gray-500 mb-2">
              SELF CHECK / GAME FEEL
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
              自分を、データで育てる
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed max-w-2xl">
              今日の状態チェック（朝/気になった時/夜）を積み上げて、傾向と回復パターンを掴む。
              診断は “責める” ためじゃなく、次の一手を選びやすくするために。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Pill>ポイント / レベル</Pill>
            <Pill className="border-amber-200 bg-amber-50/70 text-amber-900">
              朝 / 追加 / 夜
            </Pill>
            <Pill className="border-emerald-200 bg-emerald-50/70 text-emerald-900">
              履歴で育てる
            </Pill>
          </div>
        </div>

        <HomeClient />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur px-6 py-7 sm:px-8 sm:py-8">
            <div className="text-xs text-gray-500 mb-2">今日やること</div>
            <div className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              今日の状態チェック
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {[
                ["午前チェック", "今日の土台を作る"],
                ["気になった時", "違和感を早期に回収する"],
                ["夜メモ", "戻れた/ズレたを言語化する"],
              ].map(([t, d]) => (
                <div
                  key={t}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
                >
                  <div className="text-sm font-semibold text-gray-900">{t}</div>
                  <div className="mt-1 text-xs text-gray-600 leading-relaxed">
                    {d}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/state-check"
                className="inline-flex items-center justify-center rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                今日のチェックを始める
              </Link>
              <Link
                href="/state-check/history"
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                履歴を見る
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                ログイン（保存を有効化）
              </Link>
            </div>
          </section>

          <aside className="rounded-3xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur px-6 py-7 sm:px-7 sm:py-8">
            <div className="text-xs text-gray-500 mb-2">ショートカット</div>
            <div className="space-y-3">
              <Link
                href="/state-check/goals"
                className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 hover:bg-gray-100"
              >
                <div className="text-sm font-semibold text-gray-900">
                  ゴール整理
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  次の一手の “方向” を整える
                </div>
              </Link>
              <Link
                href="/"
                className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 hover:bg-gray-100"
              >
                <div className="text-sm font-semibold text-gray-900">
                  組織図ダッシュボード
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Figma 由来のトップ画面（現状維持）
                </div>
              </Link>
              <Link
                href="/meguri"
                className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 hover:bg-gray-100"
              >
                <div className="text-sm font-semibold text-gray-900">
                  MEGURI トークン実験場
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Figma トークンを安全に同居させる
                </div>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

