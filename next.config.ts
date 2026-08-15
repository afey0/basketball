import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

if (process.env.NODE_ENV !== "production") {
  import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev();
  }).catch((e) => {
    console.warn("Failed to initialize OpenNext Cloudflare Dev environment", e);
  });
}

export default nextConfig;
