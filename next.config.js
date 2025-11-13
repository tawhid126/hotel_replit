/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    // Don't fail production builds on ESLint errors; we will clean incrementally
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'res.cloudinary.com',
      'maps.googleapis.com',
    ],
  },
  reactStrictMode: true,
  swcMinify: true,
  
  // Exclude server-only modules from client bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle these server-only modules in client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default config;
