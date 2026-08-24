import type { NextConfig } from "next";

// const createNextIntlPlugin = require('next-intl/plugin');
// const withNextIntl = createNextIntlPlugin();


const nextConfig: NextConfig = {
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};
// module.exports = withNextIntl(nextConfig);
export default nextConfig;
