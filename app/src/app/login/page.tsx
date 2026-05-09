"use client";

// /login — hybrid flow:
//  1. Not Privy-authenticated → "Continue with email" CTA opens Privy modal.
//  2. Authenticated, email is in agency clients list → auto-redirect to /landlord
//     with persona=landlord (the agency invited them).
//  3. Otherwise → persona picker (imobiliária / investidor only). Self-registering
//     as landlord is NOT allowed; landlords are onboarded BY their agency.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { Wordmark } from "../../components/brand/Wordmark";
import { LangSwitch } from "../../components/shell/LangSwitch";
import { I } from "../../components/icons";
import { useT } from "../../lib/i18n";
import {
  getEmailPersona,
  setEmailPersona,
  setPersona,
  type Persona,
} from "../../lib/persona";
import {
  getAgencyStatus,
  getClientByEmail,
} from "../../lib/agency-clients";

type SelectablePersona = "agency" | "invest";

export default function LoginPage() {
  const { t } = useT();
  const router = useRouter();
  const { ready, authenticated, login, user } = usePrivy();
  const [chosen, setChosen] = useState<Persona | null>(null);
  const [autoChecked, setAutoChecked] = useState(false);

  // After Privy auth, decide persona without showing the picker when possible:
  //   1. Email is in agency clients list → /landlord (agency invited them).
  //   2. Email already chose a persona in a previous login → reuse it.
  //      Enforces 1 email = 1 persona; users cannot switch role across logins.
  //   3. Else → fall through to the picker.
  useEffect(() => {
    if (!ready || !authenticated || autoChecked) return;
    const email =
      user?.email?.address ??
      (user?.linkedAccounts.find(
        (a) => a.type === "email",
      ) as { address?: string } | undefined)?.address;
    if (email) {
      const client = getClientByEmail(email);
      if (client) {
        setPersona("landlord");
        setEmailPersona(email, "landlord");
        setChosen("landlord");
        setAutoChecked(true);
        return;
      }
      const remembered = getEmailPersona(email);
      if (remembered) {
        setPersona(remembered);
        setChosen(remembered);
        setAutoChecked(true);
        return;
      }
    }
    setAutoChecked(true);
  }, [ready, authenticated, user, autoChecked]);

  useEffect(() => {
    if (chosen) {
      let target: string;
      if (chosen === "landlord") target = "/landlord";
      else if (chosen === "agency") {
        target =
          getAgencyStatus() === "approved" ? "/agency" : "/agency/onboard";
      } else target = "/invest";
      const tm = setTimeout(() => router.push(target), 300);
      return () => clearTimeout(tm);
    }
  }, [chosen, router]);

  const onChoose = (p: SelectablePersona) => {
    setPersona(p);
    const email =
      user?.email?.address ??
      (user?.linkedAccounts.find(
        (a) => a.type === "email",
      ) as { address?: string } | undefined)?.address;
    if (email) setEmailPersona(email, p);
    setChosen(p);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--bg-0)",
        color: "var(--fg-0)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          padding: 32,
          background: "var(--bg-1)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-xl)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <Wordmark size={20} />
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <LangSwitch />
          </div>
        </div>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--fg-3)",
            marginBottom: 20,
          }}
        >
          {t("log_secure") as string}
        </div>

        {!authenticated ? (
          <div className="fade-in">
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: "0 0 8px",
              }}
            >
              {t("log_brand") as string}
            </h2>
            <p
              style={{
                color: "var(--fg-2)",
                fontSize: 14,
                margin: "0 0 28px",
                lineHeight: 1.5,
              }}
            >
              {t("log_sub") as string}
            </p>
            <button
              type="button"
              onClick={() => {
                if (!ready) return;
                login();
              }}
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
            >
              {t("log_continue") as string} <I.arrow size={16} />
            </button>
            <div
              style={{
                marginTop: 24,
                paddingTop: 24,
                borderTop: "1px solid var(--line-soft)",
                fontSize: 12,
                color: "var(--fg-3)",
                textAlign: "center",
              }}
            >
              <Link href="/" style={{ color: "var(--fg-2)" }}>
                {t("nav_back_site") as string}
              </Link>
            </div>
          </div>
        ) : !autoChecked ? (
          <div
            className="fade-in mono"
            style={{ color: "var(--fg-2)", fontSize: 13 }}
          >
            {t("log_checking") as string}…
          </div>
        ) : (
          <div className="fade-in">
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: "0 0 24px",
              }}
            >
              {t("log_persona_h") as string}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <PersonaOpt
                active={chosen === "agency"}
                onClick={() => onChoose("agency")}
                title={t("log_p_agency_t") as string}
                desc={t("log_p_agency_d") as string}
                tone="gold"
                icon={<I.shield size={20} />}
              />
              <PersonaOpt
                active={chosen === "invest"}
                onClick={() => onChoose("invest")}
                title={t("log_p_investor_t") as string}
                desc={t("log_p_investor_d") as string}
                tone="teal"
                icon={<I.trending size={20} />}
              />
            </div>
            <div
              style={{
                marginTop: 20,
                padding: 14,
                background: "var(--bg-2)",
                border: "1px solid var(--line-soft)",
                borderRadius: "var(--radius)",
                fontSize: 12.5,
                color: "var(--fg-2)",
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                  color: "var(--fg-1)",
                  fontWeight: 500,
                }}
              >
                <I.building size={13} />
                {t("log_landlord_note_h") as string}
              </div>
              {t("log_landlord_note_p") as string}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PersonaOpt({
  active,
  onClick,
  title,
  desc,
  tone,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  tone: "gold" | "teal";
  icon: React.ReactNode;
}) {
  const accent = tone === "gold" ? "var(--gold)" : "var(--teal)";
  const accentSoft = tone === "gold" ? "var(--gold-soft)" : "var(--teal-soft)";
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: 16,
        textAlign: "left",
        background: active ? accentSoft : "var(--bg-2)",
        border: "1px solid " + (active ? accent : "var(--line)"),
        borderRadius: "var(--radius)",
        transition: "background .15s, border-color .15s, color .15s",
        width: "100%",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active ? accent : "var(--bg-3)",
          color: active ? "oklch(0.18 0.02 75)" : "var(--fg-1)",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 2 }}>
          {desc}
        </div>
      </div>
      <div style={{ color: active ? accent : "var(--fg-3)" }}>
        <I.arrow size={16} />
      </div>
    </button>
  );
}
