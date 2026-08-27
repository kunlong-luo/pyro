import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { headerCsp } from "./src/config/csp";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  assetPrefix: process.env.NODE_ENV === "production" ? "/Firework_Simulator/" : "",
  basePath: process.env.NODE_ENV === "production" ? "/Firework_Simulator" : "",
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
