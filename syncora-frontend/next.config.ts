import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.46', '172.17.144.1'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Hardcoded: Use env var (NEXT_PUBLIC_API_URL) for production API URL
        destination: 'http://localhost:3001/api/:path*',
      },
      {
        source: '/socket.io/:path*',
        // Hardcoded: Use env var (NEXT_PUBLIC_WS_URL) for production WebSocket URL
        destination: 'http://localhost:3001/socket.io/:path*',
      },
    ];
  },
};

export default nextConfig;
