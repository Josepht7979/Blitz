/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bible JSON can be large; allow importing it server-side.
  experimental: { largePageDataBytes: 256 * 1024 },
};
export default nextConfig;
