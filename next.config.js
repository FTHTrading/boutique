/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // required for Docker / Railway container builds
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
