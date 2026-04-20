import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  allowedDevOrigins: [
    '10.117.56.61', 'http://10.117.56.61:3000', 'http://10.117.56.61:3001',
    '192.168.31.72', 'http://192.168.31.72:3000', 'http://192.168.31.72:3001',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
