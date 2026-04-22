"use client";

// Buffer polyfill — Anchor e @solana/web3.js precisam do Buffer global no browser.
import { Buffer } from "buffer";
if (typeof window !== "undefined") {
  (window as typeof window & { Buffer: typeof Buffer }).Buffer =
    (window as typeof window & { Buffer: typeof Buffer }).Buffer || Buffer;
}

import { PrivyProvider } from "@privy-io/react-auth";
import { Toaster } from "sonner";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export function Providers({ children }: { children: React.ReactNode }) {
  // Durante o build sem .env.local, renderiza children sem Privy.
  // Em runtime com a env var setada, tudo funciona normalmente.
  if (!PRIVY_APP_ID) {
    return (
      <>
        {children}
        <Toaster position="bottom-right" />
      </>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#f59e0b",
          showWalletLoginFirst: false,
        },
        loginMethods: ["email", "google", "wallet"],
        embeddedWallets: {
          // Privy v3: createOnLogin é por chain-type
          solana: { createOnLogin: "all-users" },
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1a1a1a",
            border: "1px solid #27272a",
            color: "#f5f5f5",
          },
        }}
      />
    </PrivyProvider>
  );
}
