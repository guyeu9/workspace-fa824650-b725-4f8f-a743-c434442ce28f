import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/client/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  title: "Text Adventure Game",
  description: "一个交互式文字冒险游戏引擎",
  keywords: ["Text Adventure", "Game", "Interactive", "Story", "RPG"],
  authors: [{ name: "Game Developer" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Text Adventure",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Text Adventure Game",
    description: "一个交互式文字冒险游戏引擎",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Text Adventure Game',
    description: '一个交互式文字冒险游戏引擎',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
