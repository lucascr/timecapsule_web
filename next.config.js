/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Enables static export
  basePath: '/timecapsule_web', // Subdirectory where the app is hosted
  assetPrefix: '/timecapsule_web', // Prefix for static assets
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"]


}

module.exports = nextConfig 