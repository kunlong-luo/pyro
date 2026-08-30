import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { metaCsp } from "@/config/csp";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://kunlong-luo.github.io/pyro/"),
  title: "烟花模拟器 | Pyro",
  description:
    "基于 Web 的烟花模拟器，具备真实粒子物理、12 种弹壳、Web Audio 与自定义背景。纯前端，零后端。",
  keywords: ["烟花", "模拟器", "fireworks", "simulator", "canvas", "particle", "web-audio"],
  authors: [{ name: "kunlong-luo" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://kunlong-luo.github.io/pyro/",
    title: "烟花模拟器 | Pyro",
    description:
      "基于 Web 的烟花模拟器，具备真实粒子物理、12 种弹壳、Web Audio 与自定义背景。",
    siteName: "Pyro - 烟花模拟器",
    images: [
      {
        url: "images/preview.png",
        width: 800,
        height: 600,
        alt: "Pyro 烟花模拟器效果预览",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "烟花模拟器 | Pyro",
    description: "基于 Web 的烟花模拟器，具备真实粒子物理、12 种弹壳、Web Audio 与自定义背景。",
    images: ["images/preview.png"],
  },
  robots: {
    index: true,
    follow: true,
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
      <body
        className={`${inter.variable} bg-black font-sans text-white antialiased`}
        suppressHydrationWarning
      >
        {/* Skip link for keyboard navigation */}
        <a href="#main" className="focus focus-on-focus sr-only">
          跳到主要内容
        </a>

        <main id="main" className="bg-black text-white">
          {children}
        </main>
        <Providers />
      </body>
    </html>
  );
}
