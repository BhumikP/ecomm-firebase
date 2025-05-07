
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.samsung.com',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com', // Added this line
      },
      // Allow any hostname for HTTPS as a broad fallback,
      // but it's better to specify known hostnames.
      {
        protocol: 'https',
        hostname: '**',
      },
      // If you also need to support HTTP from all domains (less secure):
      // {
      //   protocol: 'http',
      //   hostname: '**',
      // }
    ],
  },
};

export default nextConfig;
