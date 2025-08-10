import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "AI Vocabulary Navigator",
  description: "An English vocabulary learning app powered by Google AI.",
  manifest: "/manifest.json",
  
  // PWAのテーマカラー設定
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" }, // ライトモードの色
    { media: "(prefers-color-scheme: dark)", color: "#020817" },  // ダークモードの色
  ],

  // 【★ここを修正します★】
  // viewport設定で、ユーザーによるスケーリングを無効化
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,      // ズームインを禁止
    userScalable: false,  // ユーザーによるすべてのズーム操作を禁止
  },

  // iOSデバイスでホーム画面に追加したときの設定
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Vocab",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}