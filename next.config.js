/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // For CSV uploads
    },
  },
  images: {
    domains: [], // Add image domains as needed
  },
}

module.exports = nextConfig
