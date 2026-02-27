import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // BFF_INTERNAL_URL: server-side only (không cần NEXT_PUBLIC_)
        // Docker: http://nextjs-bff:4000
        // Dev local: http://localhost:4000
        destination: `${process.env.BFF_INTERNAL_URL || 'http://localhost:4000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
