/** @type {import('next').NextConfig} */
const nextConfig = {
  /** API proxy lives in src/app/api/[...path]/route.js — no rewrites here. */
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
