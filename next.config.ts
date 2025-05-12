
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
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      // Placeholder for your S3 bucket.
      // Replace 'your-mock-bucket.s3.mock-region.amazonaws.com'
      // with your actual bucket's hostname, e.g., 'my-eshop-bucket.s3.us-east-1.amazonaws.com'
      // Or use a broader pattern if you have multiple buckets/regions, e.g., '*.s3.amazonaws.com'
      // For the mock API, this needs to match the mocked URL structure.
      {
        protocol: 'https',
        hostname: process.env.AWS_S3_BUCKET_NAME ? `${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION || 'mock-region'}.amazonaws.com` : 'your-mock-bucket.s3.mock-region.amazonaws.com',
      },
      // Allow any hostname for HTTPS as a broad fallback if absolutely necessary,
      // but it's better to specify known hostnames.
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
