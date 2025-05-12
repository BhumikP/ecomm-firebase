
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
      // If other specific hostnames are needed, they should be added explicitly.
      // The previous entry for "encrypted-tbn0.gstatic.com" has been removed
      // as the primary issue was with the S3 bucket. If gstatic is needed,
      // it should be added as a separate specific pattern.
    ],
  },
};

export default nextConfig;
