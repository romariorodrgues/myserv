/**
 * Next.js configuration for MyServ
 * Extends remote image patterns to allow DigitalOcean Spaces CDN
 */

const cdnHost = (process.env.SPACES_PUBLIC_CDN_HOST || '').replace(/^https?:\/\//, '')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      ...(cdnHost ? [{ protocol: 'https', hostname: cdnHost }] : []),
      { protocol: 'https', hostname: '*.digitaloceanspaces.com' },
    ],
  },
}

module.exports = nextConfig

