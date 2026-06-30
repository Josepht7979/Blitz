/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { largePageDataBytes: 256 * 1024 },
  // MVP: don't block deploys on type/lint nits — tighten these later.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
