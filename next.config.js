/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'

const nextConfig = {
  // Static export only in CI (GitHub Pages). Local dev keeps full Next.js server.
  ...(isGitHubPages && { output: 'export' }),
  // GitHub Pages serves the site at /boutique (set by actions/configure-pages)
  basePath: process.env.BASE_PATH || '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
