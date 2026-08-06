import type { Metadata } from "next";
import Link from "next/link";
import { hasValidSession } from "@/lib/auth";
import { logout } from "./actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-CEO ダッシュボード",
  description: "note-business の承認・企画レビュー用ダッシュボード",
};

async function Nav() {
  const authed = await hasValidSession();
  if (!authed) return null;

  return (
    <nav className="nav">
      <span className="nav-brand">AI-CEO</span>
      <Link href="/">状況</Link>
      <Link href="/ideas">企画</Link>
      <Link href="/requests">依頼</Link>
      <form action={logout}>
        <button type="submit">ログアウト</button>
      </form>
    </nav>
  );
}

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
