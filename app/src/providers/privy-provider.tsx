"use client";

// Buffer polyfill — Anchor e @solana/web3.js precisam do Buffer global no browser.
import { Buffer } from "buffer";
if (typeof window !== "undefined") {
  (window as typeof window & { Buffer: typeof Buffer }).Buffer =
    (window as typeof window & { Buffer: typeof Buffer }).Buffer || Buffer;
}

import { PrivyProvider } from "@privy-io/react-auth";
import { Toaster } from "sonner";

const CONFIGURED_PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
const PRIVY_APP_ID =
  CONFIGURED_PRIVY_APP_ID && !CONFIGURED_PRIVY_APP_ID.includes("replace_")
    ? CONFIGURED_PRIVY_APP_ID
    : "clp2z4zw70000l80f6wytrc3z";

export function Providers({ children }: { children: React.ReactNode }) {
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
