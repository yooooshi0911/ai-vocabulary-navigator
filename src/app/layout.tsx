import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
};

export const metadata: Metadata = {
  title: "AI Vocabulary Navigator | Gemini 3.8 Flash搭載",
  description: "Google Gemini 3.8 Flashによる高精度な英語・日本語AI単語ナビゲーター。発音、語源、類義語の使い分けまで深く学習。",
  manifest: "/manifest.json",
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