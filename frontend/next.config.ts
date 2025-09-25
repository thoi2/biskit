import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    proxyTimeout: 120000, // 먼저 120초로 검증 후 필요시 상향
  },
  async rewrites() {
    return [
      {
        // source: '/api/' 로 시작하는 모든 경로의 요청은
        source: "/api/:path*",
        // destination: 'http://backend:8080/api/' 경로로 대신 보낸다
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

  // ▼▼▼ 핫 리로딩을 위한 폴링 설정 추가 ▼▼▼
  webpack: (config, { dev }) => {
    // 개발 모드일 때만 폴링 설정을 적용합니다.
    if (dev) {
      config.watchOptions = {
        poll: 1000, // 1초마다 파일 변경을 확인합니다.
        aggregateTimeout: 300, // 변경이 감지된 후 0.3초간 기다렸다가 다시 빌드합니다.
      };
    }
    return config;
  },
  // ▲▲▲ 여기까지 추가 ▲▲▲
};

export default nextConfig;