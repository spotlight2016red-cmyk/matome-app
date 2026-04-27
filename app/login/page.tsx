import type { Metadata } from "next";
import { LoginClient } from "./ui/LoginClient";

export const metadata: Metadata = {
  title: "ログイン | SPOTLIGHT FILMS",
  description: "診断データをユーザーごとに保存するためにログインします。",
};

export default function LoginPage() {
  return (
    <div className="size-full min-h-screen ui-surface-muted px-5 py-10 sm:px-8 sm:py-14 md:px-16">
      <div className="mx-auto w-full max-w-7xl">
        <LoginClient />
      </div>
    </div>
  );
}

