/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint completely (TypeScript checking still works)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
