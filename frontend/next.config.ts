import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  async rewrites() {
    return [
      {
        // source: '/api/' 로 시작하는 모든 경로의 요청은
        source: "/api/:path*",
        // destination: 'http://localhost:8080/api/' 경로로 대신 보낸다
        destination: "http://backend:8080/api/:path*", 
      },
    ];
  },
};

export default nextConfig;
