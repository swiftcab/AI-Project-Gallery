import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Le worker BullMQ et Prisma ne doivent pas être bundlés côté serverless-style
  serverExternalPackages: ["@prisma/client", "bullmq", "ioredis", "pino"],
};

export default nextConfig;
