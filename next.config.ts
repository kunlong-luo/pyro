import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { headerCsp } from "./src/config/csp";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// GitHub Pages needs basePath + static export; Vercel doesn't
const isGitHubPages = process.env.NEXT_PUBLIC_DEPLOY_TARGET === "github-pages";

const nextConfig: NextConfig = {
  // Only use static export for GitHub Pages; Vercel supports SSR
  ...(isGitHubPages && { output: "export" }),
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // Only set basePath for GitHub Pages (subpath deployment)
  ...(isGitHubPages && {
    assetPrefix: "/pyro/",
    basePath: "/pyro",
  }),
  // Silence Turbopack warning
  turbopack: {},
  // No-op under output: "export" (no server to send headers from — Next
  // warns on every build). Kept so these apply for free if this ever moves
  // off static export; src/app/layout.tsx's <meta> tag covers CSP for the
  // current GitHub Pages deployment, which can't send custom headers either.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: headerCsp,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
