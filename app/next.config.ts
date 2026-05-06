import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 usa Turbopack por default. Módulos Node (fs, net, tls, crypto)
  // são stubados automaticamente pelo Turbopack no bundle do browser — não
  // precisa de polyfill manual como no webpack.
  // root explícito silencia o warning de "multiple lockfiles" em worktrees.
  turbopack: { root: path.resolve(__dirname, "..") },
  // Mantém o webpack config pra caso alguém rode com --webpack explicitamente.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
