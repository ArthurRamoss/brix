"use client";

// Authenticated app chrome — header (logo, persona indicator, tabs, lang, address, logout)
// + tab strip on mobile + content slot. Used by /landlord, /agency, /invest.
// Persona drives the accent color.
//
// Ported from Brix-handoff/brix/project/landlord.jsx AppShell.

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { Logo } from "../brand/Logo";
import { I } from "../icons";
import { LangSwitch } from "./LangSwitch";
import { useT } from "../../lib/i18n";
import { clearPersona, type Persona } from "../../lib/persona";

export type Tab = { id: string; label: string };

type AppShellProps = {
  persona: Persona;
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  children: ReactNode;
};

function shortAddr(addr: string | null | undefined): string {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function AppShell({
  persona,
  tabs,
  activeTab,
  setActiveTab,
  children,
}: AppShellProps) {
  const router = useRouter();
  const { t } = useT();
  const { logout, user } = usePrivy();

  const accent = persona === "invest" ? "var(--teal)" : "var(--gold)";

  const personaLabel =
    persona === "landlord"
      ? t("shell_landlord")
      : persona === "agency"
        ? t("shell_agency")
        : t("shell_investor");

  const solanaWallet = user?.linkedAccounts.find(
    (a) =>
      a.type === "wallet" &&
      "chainType" in a &&
      (a as { chainType: string }).chainType === "solana",
  ) as { address: string } | undefined;
  const address = solanaWallet?.address;

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      clearPersona();
      router.push("/");
    }
  };

  return (
    <div
      style={{ minHeight: "100vh", background: "var(--bg-0)", color: "var(--fg-0)" }}
    >
      <header
        className="app-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 24px",
          borderBottom: "1px solid var(--line)",
          background: "var(--bg-1)",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <Logo size={22} />
          <span
            className="hidden md:inline"
            style={{
              fontWeight: 600,
              fontSize: 16,
              letterSpacing: "-0.02em",
            }}
          >
            brix
          </span>
        </Link>
        <div
          className="mono"
          style={{
            marginLeft: 8,
            paddingLeft: 12,
            borderLeft: "1px solid var(--line)",
            fontSize: 12,
            color: "var(--fg-2)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span className="dot" style={{ color: accent }} />
          <span>{personaLabel}</span>
        </div>

        {tabs.length > 0 && (
          <nav className="hidden md:flex" style={{ gap: 4, marginLeft: 24 }}>
            {tabs.map((tb) => (
              <button
                key={tb.id}
                onClick={() => setActiveTab(tb.id)}
                style={{
                  padding: "8px 14px",
                  fontSize: 14,
                  color: activeTab === tb.id ? "var(--fg-0)" : "var(--fg-2)",
                  background:
                    activeTab === tb.id ? "var(--bg-2)" : "transparent",
                  borderRadius: 8,
                  fontWeight: activeTab === tb.id ? 500 : 400,
                }}
              >
                {tb.label}
              </button>
            ))}
          </nav>
        )}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <LangSwitch />
          {address && (
            <div
              className="mono hidden md:inline-flex"
              style={{
                padding: "6px 10px",
                fontSize: 12,
                background: "var(--bg-2)",
                borderRadius: 6,
                color: "var(--fg-1)",
                border: "1px solid var(--line)",
              }}
              title={t("shell_wallet_tip") as string}
            >
              {shortAddr(address)}
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: 8,
              color: "var(--fg-2)",
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            title={t("shell_logout") as string}
            aria-label={t("shell_logout") as string}
          >
            <I.logout size={16} />
          </button>
        </div>
      </header>

      {tabs.length > 0 && (
        <div
          className="flex md:hidden"
          style={{
            overflowX: "auto",
            gap: 4,
            padding: "12px 16px",
            borderBottom: "1px solid var(--line)",
            background: "var(--bg-1)",
          }}
        >
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id)}
              style={{
                padding: "6px 12px",
                fontSize: 13,
                whiteSpace: "nowrap",
                color:
                  activeTab === tb.id
                    ? persona === "invest"
                      ? "oklch(0.18 0.02 195)"
                      : "oklch(0.18 0.02 75)"
                    : "var(--fg-1)",
                background: activeTab === tb.id ? accent : "var(--bg-2)",
                borderRadius: 999,
                fontWeight: 500,
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>
      )}

      <div className="app-content" style={{ padding: 32 }}>
        {children}
      </div>
    </div>
  );
}
