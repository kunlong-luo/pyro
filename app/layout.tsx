import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SvgSprite } from "@/components/SvgSprite";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "烟花模拟器",
  description: "基于 Web 的烟花模拟器，具备真实粒子物理、12 种弹壳、Web Audio 与自定义背景",
  openGraph: {
    title: "烟花模拟器",
    description: "基于 Web 的烟花模拟器，具备真实粒子物理、12 种弹壳、Web Audio 与自定义背景",
    images: ["/images/favicon.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/images/favicon.png" sizes="any" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-black text-white`}>
        <SvgSprite />
        {children}
      </body>
    </html>
  );
}