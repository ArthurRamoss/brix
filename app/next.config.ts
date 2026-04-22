import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 usa Turbopack por default. Módulos Node (fs, net, tls, crypto)
  // são stubados automaticamente pelo Turbopack no bundle do browser — não
  // precisa de polyfill manual como no webpack.
  turbopack: {},
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
