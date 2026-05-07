"use client";

// /agency/onboard — Founding partner application form.
// Real flow: imobiliária submits → Brix reviews → email approval. Demo flow:
// submit → status "pending" → "advance demo" CTA flips to "approved" → /agency.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { Wordmark } from "../../../components/brand/Wordmark";
import { LangSwitch } from "../../../components/shell/LangSwitch";
import { I } from "../../../components/icons";
import { Card } from "../../../components/primitives/Card";
import { useT } from "../../../lib/i18n";
import { getPersona, setPersona } from "../../../lib/persona";
import {
  getAgencyApplication,
  getAgencyStatus,
  saveAgencyApplication,
  setAgencyStatus,
  type AgencyApplication,
} from "../../../lib/agency-clients";

type Stage = "form" | "submitted";

export default function AgencyOnboardPage() {
  const { t } = useT();
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [stage, setStage] = useState<Stage>("form");
  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    website: "",
    city: "",
    contractsUnderManagement: 0,
  });

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.push("/login");
      return;
    }
    setPersona("agency");
    const status = getAgencyStatus();
    if (status === "approved") {
      router.push("/agency");
      return;
    }
    const existing = getAgencyApplication();
    if (existing) {
      setForm({
        companyName: existing.companyName ?? "",
        contactName: existing.contactName ?? "",
        email: existing.email ?? "",
        website: existing.website ?? "",
        city: existing.city ?? "",
        contractsUnderManagement: existing.contractsUnderManagement ?? 0,
      });
      if (status === "pending") setStage("submitted");
    } else {
      const email =
        user?.email?.address ??
        (
          user?.linkedAccounts.find((a) => a.type === "email") as
            | { address?: string }
            | undefined
        )?.address ??
        "";
      setForm((prev) => ({ ...prev, email }));
    }
    setHydrated(true);
  }, [ready, authenticated, user, router]);

  const valid =
    form.companyName.trim().length > 1 &&
    form.contactName.trim().length > 1 &&
    /.+@.+\..+/.test(form.email);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const app: AgencyApplication = {
      companyName: form.companyName.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      website: form.website.trim() || undefined,
      city: form.city.trim() || undefined,
      contractsUnderManagement: form.contractsUnderManagement || undefined,
      appliedAt: Date.now(),
    };
    saveAgencyApplication(app);
    setAgencyStatus("pending");
    setStage("submitted");
  };

  const onDemoApprove = () => {
    setAgencyStatus("approved");
    router.push("/agency");
  };

  if (!hydrated) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-0)",
        color: "var(--fg-0)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 24px",
          borderBottom: "1px solid var(--line)",
          background: "var(--bg-1)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <Wordmark size={20} />
        </Link>
        <div style={{ marginLeft: "auto" }}>
          <LangSwitch />
        </div>
      </header>

      <div
        style={{
          padding: 32,
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        {stage === "submitted" ? (
          <SubmittedState
            companyName={form.companyName}
            onDemoApprove={onDemoApprove}
          />
        ) : (
          <form onSubmit={onSubmit} className="fade-in">
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--gold)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              {t("ob_kicker") as string}
            </div>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                margin: "0 0 12px",
              }}
            >
              {t("ob_h1") as string}
            </h1>
            <p
              style={{
                color: "var(--fg-2)",
                fontSize: 15,
                margin: "0 0 32px",
                lineHeight: 1.55,
                maxWidth: 580,
              }}
            >
              {t("ob_sub") as string}
            </p>

            <Card>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">
                    {t("ob_company_l") as string} *
                  </label>
                  <input
                    value={form.companyName}
                    onChange={(e) =>
                      setForm({ ...form, companyName: e.target.value })
                    }
                    placeholder={t("ob_company_ph") as string}
                    className="field"
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    {t("ob_contact_l") as string} *
                  </label>
                  <input
                    value={form.contactName}
                    onChange={(e) =>
                      setForm({ ...form, contactName: e.target.value })
                    }
                    placeholder={t("ob_contact_ph") as string}
                    className="field"
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    {t("ob_email_l") as string} *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="contato@imobiliaria.com.br"
                    className="field"
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    {t("ob_website_l") as string}
                  </label>
                  <input
                    value={form.website}
                    onChange={(e) =>
                      setForm({ ...form, website: e.target.value })
                    }
                    placeholder="www.dominio.com.br"
                    className="field"
                  />
                </div>
                <div>
                  <label className="label">{t("ob_city_l") as string}</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="São Paulo, SP"
                    className="field"
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">
                    {t("ob_contracts_l") as string}
                  </label>
                  <input
                    type="number"
                    value={form.contractsUnderManagement || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contractsUnderManagement: +e.target.value || 0,
                      })
                    }
                    placeholder="0"
                    className="field tnum mono"
                    min={0}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--fg-3)",
                      marginTop: 6,
                    }}
                  >
                    {t("ob_contracts_help") as string}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 24,
                  padding: 14,
                  background: "var(--bg-2)",
                  borderRadius: "var(--radius)",
                  fontSize: 12.5,
                  color: "var(--fg-2)",
                  lineHeight: 1.5,
                }}
              >
                {t("ob_disclaimer") as string}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 24,
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href="/login"
                  style={{
                    color: "var(--fg-2)",
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  ← {t("nav_back") as string}
                </Link>
                <button
                  type="submit"
                  disabled={!valid}
                  className="btn btn-primary btn-lg"
                >
                  {t("ob_submit") as string} <I.arrow size={16} />
                </button>
              </div>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
}

function SubmittedState({
  companyName,
  onDemoApprove,
}: {
  companyName: string;
  onDemoApprove: () => void;
}) {
  const { t } = useT();
  return (
    <div className="fade-in" style={{ marginTop: 40 }}>
      <Card style={{ padding: 40, textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            margin: "0 auto 20px",
            background: "var(--gold-soft)",
            color: "var(--gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <I.check size={28} />
        </div>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--gold)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}
        >
          {t("ob_done_kicker") as string}
        </div>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            margin: "0 0 8px",
          }}
        >
          {(t("ob_done_h") as string).replace("{company}", companyName)}
        </h2>
        <p
          style={{
            color: "var(--fg-2)",
            fontSize: 14,
            lineHeight: 1.6,
            margin: "0 auto 28px",
            maxWidth: 480,
          }}
        >
          {t("ob_done_p") as string}
        </p>

        <div
          style={{
            padding: 16,
            background: "var(--bg-2)",
            border: "1px dashed var(--line)",
            borderRadius: "var(--radius)",
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--fg-3)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 6,
            }}
          >
            {t("ob_demo_label") as string}
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 }}>
            {t("ob_demo_p") as string}
          </div>
          <button
            onClick={onDemoApprove}
            className="btn btn-primary"
            style={{ marginTop: 14 }}
          >
            {t("ob_demo_cta") as string} <I.arrow size={14} />
          </button>
        </div>

        <Link
          href="/"
          style={{
            color: "var(--fg-2)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          {t("nav_back_site") as string}
        </Link>
      </Card>
    </div>
  );
}
