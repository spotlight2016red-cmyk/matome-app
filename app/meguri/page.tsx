import Link from "next/link";
import "./meguri.css";

export default function MeguriPage() {
  return (
    <div className="meguri min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14 md:px-16">
        <div className="mb-10 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            ← ホームへ
          </Link>
          <div className="text-xs opacity-70">
            Figma（MEGURI）UI の統合用ページ
          </div>
        </div>

        <div className="meguri-card p-8 sm:p-10">
          <div className="mb-4">
            <div
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white meguri-gradient-primary"
              style={{ boxShadow: "var(--shadow-md)" }}
            >
              MEGURI UI
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            自分を、データで育てる
          </h1>
          <p className="mt-3 text-base sm:text-lg opacity-80 leading-relaxed">
            ここは Figma のデザイントークンを “安全に同居” させるための土台。
            次は zip 内の `Hero` / `Features` などを Next.js のルートに移植していきます。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://zebra-koala-79673489.figma.site"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white meguri-gradient-divine"
              style={{ boxShadow: "var(--shadow-md)" }}
            >
              Figma site を開く
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              ログインへ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

