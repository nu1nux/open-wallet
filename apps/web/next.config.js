/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@wallet-suite/types',
    '@wallet-suite/utils',
    '@wallet-suite/storage',
    '@wallet-suite/wallet-core',
    '@wallet-suite/ui-kit',
  ],
};

module.exports = nextConfig;
