/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // GitHub Pages serves the site at /boutique (set by actions/configure-pages)
  basePath: process.env.BASE_PATH || '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
