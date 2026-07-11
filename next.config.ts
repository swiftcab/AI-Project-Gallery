import type { NextConfig } from "next";

// En-têtes de sécurité (cf. docs/security-compliance.md).
// CSP volontairement absente au MVP : le JSON-LD inline et les styles inline
// de la landing demandent des nonces — planifié, pas bâclé (tech-debt.md #8).
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Le worker BullMQ et Prisma ne doivent pas être bundlés côté serverless-style
  serverExternalPackages: ["@prisma/client", "bullmq", "ioredis", "pino"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
