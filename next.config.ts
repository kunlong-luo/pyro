import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  assetPrefix: process.env.NODE_ENV === "production" ? "/Firework_Simulator/" : "",
  basePath: process.env.NODE_ENV === "production" ? "/Firework_Simulator" : "",
};

export default nextConfig;