import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "AI Vocabulary Navigator",
  description: "An English vocabulary learning app powered by Google AI.",
  manifest: "/manifest.json",

  // 旧: themeColor: "#0f172a",
  // → 正しくは themeColor はここに置く（viewportの外）
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],

  viewport: {
    width: "device-width",
    initialScale: 1,
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "AI Vocab",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 初期HTMLから dark クラスを付与
    <html lang="ja" className="dark" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
