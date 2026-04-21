import type { Metadata } from "next";
import { StateCheckClient } from "./_components/StateCheckClient";

export const metadata: Metadata = {
  title: "現在地診断 | SPOTLIGHT FILMS",
  description:
    "性格診断ではなく、いまの状態を可視化し次の一手を出すための状態診断ツール。",
};

export default function StateCheckPage() {
  return (
    <div className="size-full min-h-screen bg-white px-5 py-10 sm:px-8 sm:py-14 md:px-16">
      <StateCheckClient />
    </div>
  );
}

