import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "筋トレ記録アプリ",
  description: "トレーニング記録・目標管理・進捗追跡アプリ",
  manifest: "../public/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="block-container">
          <header>
            <h1>🏋️ 筋トレ記録・管理アプリ</h1>
            <p className="small-muted">最終更新: {today}</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
