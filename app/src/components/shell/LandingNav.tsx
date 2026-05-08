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
      className="app-header"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 24px",
        borderBottom: "1px solid var(--line)",
        position: "sticky",
        top: 0,
        background: "var(--bg-1)",
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
