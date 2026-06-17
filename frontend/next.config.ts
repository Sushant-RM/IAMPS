import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/portfolio', destination: '/dashboard/portfolio', permanent: true },
    ];
  },
};

export default nextConfig;
