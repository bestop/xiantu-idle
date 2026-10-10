import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "仙途 · 文字放置修仙",
  description:
    "一款 Harpagia 式的文字放置修仙 RPG：16 项技能修炼至 200 级、百种妖兽、真实离线进度、随机词条装备、怪物卡收集。修仙之路，闭关亦有所得。",
  keywords: ["修仙", "放置游戏", "挂机", "idle RPG", "仙侠", "文字游戏"],
  applicationName: "仙途",
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
