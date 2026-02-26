/** @type {import('next').NextConfig} */

// GitHub Pages static export — only when running in GitHub Actions CI
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'

const nextConfig = {
  // Netlify and local dev use full Next.js (SSR + API routes).
  // GitHub Pages requires static export (API routes removed in CI workflow).
  ...(isGitHubPages && { output: 'export' }),

  // basePath set automatically by actions/configure-pages on GitHub Pages.
  // On Netlify and local this is empty.
  basePath: process.env.BASE_PATH || '',

  // trailingSlash needed for GitHub Pages static file resolution.
  trailingSlash: isGitHubPages,

  images: {
    unoptimized: true, // Required for static export; also fine for Netlify
  },

  // Suppress noisy build output
  logging: {
    fetches: { fullUrl: false },
  },
}

module.exports = nextConfig
