/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ensure the letterhead PDF is bundled into the serverless functions that
    // read it at runtime (Vercel only includes traced files otherwise).
    outputFileTracingIncludes: {
      "/api/generate": ["./templates/**"],
      "/api/share": ["./templates/**"],
      "/api/templates/preview": ["./templates/**"],
    },
  },
};
export default nextConfig;
