import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default 1MB rejects most real CV PDFs (photo + formatting pushes base64
    // payload over the limit) before the Server Action even runs — surfaces to
    // the user as a generic "server error" with no useful detail.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
