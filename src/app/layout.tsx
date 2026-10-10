import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://xiantu-idle.vercel.app"),
  title: "仙途 · 文字放置修仙",
  description:
    "一款 Harpagia 式的文字放置修仙 RPG：16 项技能修炼至 200 级、130 种妖兽图鉴、10 位世界 BOSS、真实离线进度、随机词条装备、炼宝坊专属神装。修仙之路，闭关亦有所得。",
  keywords: ["修仙", "放置游戏", "挂机", "idle RPG", "仙侠", "文字游戏"],
  applicationName: "仙途",
  icons: { icon: "/logo.svg" },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "仙途",
    title: "仙途 · 文字放置修仙",
    description:
      "提灯小修士的仙路之旅：16 项技能、130 种妖兽图鉴、10 大区域与妖王、离线也能变强。水墨水彩绘本风放置修仙 RPG。",
    images: [
      {
        url: "/og-cover.jpg",
        width: 1200,
        height: 630,
        alt: "仙途 —— 提灯小修士远眺鎏金仙宫，水墨水彩绘本风",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "仙途 · 文字放置修仙",
    description: "提灯小修士的仙路之旅：离线也能变强的水墨风放置修仙 RPG。",
    images: ["/og-cover.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0c1524",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased bg-stone-950 text-stone-200">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
