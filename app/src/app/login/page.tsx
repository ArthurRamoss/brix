"use client";

// /login — hybrid flow:
//  1. Not Privy-authenticated → "Continue with email" CTA opens Privy modal.
//  2. Authenticated, no persona → persona picker (proprietário / imobiliária / investidor).
//  3. On select → persist persona to localStorage and redirect to /{persona}.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { Wordmark } from "../../components/brand/Wordmark";
import { LangSwitch } from "../../components/shell/LangSwitch";
import { I } from "../../components/icons";
import { useT } from "../../lib/i18n";
import { setPersona, type Persona } from "../../lib/persona";

export default function LoginPage() {
  const { t } = useT();
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();
  const [chosen, setChosen] = useState<Persona | null>(null);

  // If user logs in via Privy modal, we'll fall through to the persona picker.
  // If they had previously chosen a persona, AppShell handles that — but on /login
  // we always show the picker so they can change it.

  useEffect(() => {
    if (chosen) {
      const target = chosen === "landlord" ? "/landlord" : chosen === "agency" ? "/agency" : "/invest";
      const tm = setTimeout(() => router.push(target), 300);
      return () => clearTimeout(tm);
    }
  }, [chosen, router]);

  const onChoose = (p: Persona) => {
    setPersona(p);
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
              onClick={() => login()}
              disabled={!ready}
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
        ) : (
          <div className="fade-in">
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: "0 0 8px",
              }}
            >
              {t("log_persona_h") as string}
            </h2>
            <p
              style={{
                color: "var(--fg-2)",
                fontSize: 14,
                margin: "0 0 24px",
              }}
            >
              {t("log_persona_sub") as string}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <PersonaOpt
                active={chosen === "landlord"}
                onClick={() => onChoose("landlord")}
                title={t("log_p_landlord_t") as string}
                desc={t("log_p_landlord_d") as string}
                tone="gold"
                icon={<I.building size={20} />}
              />
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
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
        </div>
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
