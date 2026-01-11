import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export", // 注释掉静态导出以支持API路由
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
