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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        port: '',
        pathname: '/**', // lh3.googleusercontent.com 도메인의 모든 경로를 허용
      },
      // 만약 다른 도메인도 필요하다면 여기에 추가하면 됩니다.
    ],
  },
};

export default nextConfig;
