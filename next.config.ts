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
        hostname: '**', // Allow any hostname for HTTPS
        port: '', // Allow any port
        pathname: '/**', // Allow any path
      },
      // Specifically allow the domain causing the error
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
      // If you also need to support HTTP from all domains (less secure):
      // {
      //   protocol: 'http',
      //   hostname: '**',
      //   port: '',
      //   pathname: '/**',
      // }
    ],
  },
};

export default nextConfig;
