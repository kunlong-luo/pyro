import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { metaCsp } from "@/config/csp";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://nianbroken.github.io/Firework_Simulator/"),
  title: "烟花模拟器",
  description: "基于 Web 的烟花模拟器，具备真实粒子物理、12 种弹壳、Web Audio 与自定义背景",
  openGraph: {
    title: "烟花模拟器",
    description: "基于 Web 的烟花模拟器，具备真实粒子物理、12 种弹壳、Web Audio 与自定义背景",
    images: ["images/favicon.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* Actual CSP enforcement on GitHub Pages: static hosting can't send
            custom HTTP headers, so next.config.ts's headers() (kept for a
            future non-static deployment) never takes effect here. */}
        <meta httpEquiv="Content-Security-Policy" content={metaCsp} />
        <link rel="icon" href="/images/favicon.png" sizes="any" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} bg-black font-sans text-white antialiased`} suppressHydrationWarning>
        {/* Skip link for keyboard navigation */}
        <a href="#main" className="focus focus-on-focus sr-only">
          跳到主要内容
        </a>

        <main id="main" className="bg-black text-white">
          {children}
        </main>
      </body>
    </html>
  );
}
