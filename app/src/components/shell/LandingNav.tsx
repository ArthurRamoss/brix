"use client";

// Landing page nav — sticky, blurred bg, with full set of public links.
// Ported from Brix-handoff/brix/project/landing.jsx LandingNav.
//
// When the user is already authenticated (via Privy), the right-side CTAs
// collapse into a single "dashboard" link that routes them to their persona's
// home (/agency, /invest, or /landlord). Without this, clicking the visible
// "sign in" / "get started" sends a logged-in user back to /login and forces
// the persona picker to flash before the auto-route resolves.

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Wordmark } from "../brand/Wordmark";
import { LangSwitch } from "./LangSwitch";
import { useT } from "../../lib/i18n";
import { getPersona } from "../../lib/persona";

function dashboardHrefFor(
  persona: ReturnType<typeof getPersona>,
): string {
  if (persona === "agency") return "/agency";
  if (persona === "landlord") return "/landlord";
  if (persona === "invest") return "/invest";
  // Persona unknown but authenticated — /login resolves it from the email
  // lock + agency-client check, then redirects.
  return "/login";
}

export function LandingNav() {
  const { t } = useT();
  const { ready, authenticated } = usePrivy();
  const [persona, setPersonaState] = useState<ReturnType<typeof getPersona>>(null);

  // getPersona reads localStorage which is unavailable during SSR — defer to
  // a useEffect so the first render matches the server's "not authenticated"
  // shape, then upgrade to the dashboard CTA on the client.
  useEffect(() => {
    setPersonaState(getPersona());
  }, [authenticated]);

  const showDashboard = ready && authenticated;
  const dashboardHref = showDashboard ? dashboardHrefFor(persona) : "/login";

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
        {showDashboard ? (
          <Link href={dashboardHref} className="btn btn-primary btn-sm">
            {t("nav_dashboard") as string}
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="btn btn-ghost btn-sm hidden md:inline-flex"
            >
              {t("nav_signin")}
            </Link>
            <Link href="/login" className="btn btn-primary btn-sm">
              {t("nav_start")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
