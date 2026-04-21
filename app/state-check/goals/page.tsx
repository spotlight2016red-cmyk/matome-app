import type { Metadata } from "next";
import { GoalsClient } from "./ui/GoalsClient";

export const metadata: Metadata = {
  title: "ゴール整理 | SPOTLIGHT FILMS",
  description: "大ゴール / 中ゴール / 小ゴールを整理して保存する。",
};

export default function GoalsPage() {
  return (
    <div className="size-full min-h-screen bg-white px-5 py-10 sm:px-8 sm:py-14 md:px-16">
      <GoalsClient />
    </div>
  );
}

