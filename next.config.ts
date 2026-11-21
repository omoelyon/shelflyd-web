import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'api.shelflyd.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '*.r2.dev' },
      // Your own photo domain(s) for R2 (e.g. media.shelflyd.com), so they are resized too. Keep in step with src/lib/image.ts.
      ...(process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '')
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean)
        .map((hostname) => ({ protocol: 'https' as const, hostname })),
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
