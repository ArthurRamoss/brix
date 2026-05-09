import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 usa Turbopack por default. Módulos Node (fs, net, tls, crypto)
  // são stubados automaticamente pelo Turbopack no bundle do browser — não
  // precisa de polyfill manual como no webpack.
  // root explícito silencia o warning de "multiple lockfiles" em worktrees.
  turbopack: { root: path.resolve(__dirname, "..") },

  // Skip TypeScript + ESLint checks during `next build`. We type-check locally
  // (`pnpm exec tsc --noEmit`) and rely on dev-time errors. Skipping here cuts
  // ~2 min from the production build (Appwrite Sites doesn't cache builds, so
  // every deploy paid that cost). Re-enable if you want the build to be
  // strict on its own — but be ready for the time hit.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
