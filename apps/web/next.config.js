/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@open-wallet/types',
    '@open-wallet/utils',
    '@open-wallet/storage',
    '@open-wallet/wallet-core',
    '@open-wallet/ui-kit',
  ],
};

module.exports = nextConfig;
