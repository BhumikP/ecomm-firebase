
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
        hostname: 'eshop-test1.s3.ap-south-1.amazonaws.com', // Specific S3 hostname
      },
      // The following are more general patterns that might help if there are subtle variations
      // or other S3 buckets. They are generally safe to include.
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
        hostname: 'encrypted-tbn0.gstatic.com', // Added for Google Shopping images encountered in previous errors
      }
    ],
  },
};

export default nextConfig;
