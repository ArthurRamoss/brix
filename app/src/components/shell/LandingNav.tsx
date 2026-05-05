"use client";

// Landing page nav — sticky, blurred bg, with full set of public links.
// Ported from Brix-handoff/brix/project/landing.jsx LandingNav.

import Link from "next/link";
import { Wordmark } from "../brand/Wordmark";
import { LangSwitch } from "./LangSwitch";
import { useT } from "../../lib/i18n";

export function LandingNav() {
  const { t } = useT();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "20px 48px",
        borderBottom: "1px solid var(--line-soft)",
        position: "sticky",
        top: 0,
        background: "oklch(0.16 0.005 75 / 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 10,
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center" }}>
        <Wordmark size={20} />
      </Link>
      <div
        className="hidden md:flex"
        style={{ gap: 28, marginLeft: 56, fontSize: 14, color: "var(--fg-1)" }}
      >
        <Link href="/how">{t("nav_how")}</Link>
        <Link href="/pub/landlord">{t("nav_landlord")}</Link>
        <Link href="/pub/invest">{t("nav_invest")}</Link>
        <Link href="/pub/agency">{t("nav_agency")}</Link>
      </div>
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <LangSwitch />
        <Link href="/login" className="btn btn-ghost btn-sm hidden md:inline-flex">
          {t("nav_signin")}
        </Link>
        <Link href="/login" className="btn btn-primary btn-sm">
          {t("nav_start")}
        </Link>
      </div>
    </div>
  );
}
