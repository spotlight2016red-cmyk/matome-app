import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // クライアントで「本番デプロイのみ」を判定する（Vercel がビルド時に VERCEL_ENV を渡す）
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
  },
};

export default nextConfig;
