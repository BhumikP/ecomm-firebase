// @ts-check
import { withSentryConfig } from "@sentry/nextjs";

/**
 * @template {import('next').NextConfig} T
 * @param {T} config - A generic parameter that flows through to the return type
 * @constraint {{import('next').NextConfig}}
 */
function defineNextConfig(config) {
  return config;
}

const nextConfig = defineNextConfig({
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
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'eshop-test1.s3.ap-south-1.amazonaws.com',
        port: '',
        pathname: '/**', // Allow all paths within this bucket
      },
    ],
  },
  // Optional: Set experimental.serverActions.allowedOrigins if needed for Server Actions
  // experimental: {
  //   serverActions: {
  //     allowedOrigins: ['your-app-domain.com', 'localhost:9002'], // Add your domains
  //   },
  // },
});

export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: process.env.SENTRY_ORG, // Optional: Reads from .env.local
    project: process.env.SENTRY_PROJECT, // Optional: Reads from .env.local
  }
);
