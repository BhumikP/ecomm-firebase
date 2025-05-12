
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
        hostname: 'eshop-test1.s3.ap-south-1.amazonaws.com', 
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com', // General pattern for S3
      },
       {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com', // General pattern for region-specific S3
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com', 
      },
      {
        protocol: 'https',
        hostname: 'images.samsung.com', // Added from previous request
      }
    ],
  },
};

export default nextConfig;
