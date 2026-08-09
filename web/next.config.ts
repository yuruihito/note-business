import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @napi-rs/canvas ships a native binary; it must be loaded via require()
  // at runtime rather than bundled, or Turbopack fails to place its asset.
  serverExternalPackages: ["@napi-rs/canvas"],
};

export default nextConfig;
