
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
      // AWS S3 Bucket hostname. This relies on AWS_S3_BUCKET_NAME and AWS_S3_REGION environment variables.
      // Example: if AWS_S3_BUCKET_NAME=my-eshop-bucket and AWS_S3_REGION=us-east-1,
      // this will allow images from my-eshop-bucket.s3.us-east-1.amazonaws.com
      {
        protocol: 'https',
        hostname: `${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com`,
      },
      // Allow any hostname for HTTPS as a broad fallback if absolutely necessary,
      // but it's better to specify known hostnames. This was present before, retaining.
      // Consider removing if all image sources are known and configured.
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
