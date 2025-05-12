
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
        hostname: 'eshop-test1.s3.ap-south-1.amazonaws.com',
        pathname: '/products/**', // Specific path for product images on S3
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**', // Allow any path on picsum.photos
      },
      // Removed the overly broad 'hostname: "**"' pattern.
      // If other specific hostnames are needed, they should be added explicitly.
    ],
  },
};

export default nextConfig;
