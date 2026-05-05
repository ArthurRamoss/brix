"use client";

// Nav for public marketing pages (/pub/*). `tone` decides accent color
// for the active-link highlight (gold for landlord/agency, teal for invest).
// Ported from Brix-handoff/brix/project/public-pages.jsx PublicNav.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "../brand/Wordmark";
import { LangSwitch } from "./LangSwitch";
import { useT } from "../../lib/i18n";

type Tone = "gold" | "teal";

type PublicNavProps = {
  tone: Tone;
};

export function PublicNav({ tone }: PublicNavProps) {
  const { t } = useT();
  const pathname = usePathname();
  const accent = tone === "teal" ? "var(--teal)" : "var(--gold)";

  const linkColor = (href: string, linkTone: Tone) =>
    pathname === href && tone === linkTone ? accent : undefined;

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
        <Link
          href="/pub/landlord"
          style={{ color: linkColor("/pub/landlord", "gold") }}
        >
          {t("nav_landlord")}
        </Link>
        <Link
          href="/pub/invest"
          style={{ color: linkColor("/pub/invest", "teal") }}
        >
          {t("nav_invest")}
        </Link>
        <Link
          href="/pub/agency"
          style={{ color: linkColor("/pub/agency", "gold") }}
        >
          {t("nav_agency")}
        </Link>
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
        <Link href="/login" className="btn btn-primary btn-sm">
          {t("nav_start")}
        </Link>
      </div>
    </div>
  );
}
