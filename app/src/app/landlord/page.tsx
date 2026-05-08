"use client";

// /landlord — Property owner POV (passive).
// New flow: the agency onboards landlords by adding them to its private client
// roster. When the landlord logs in with the email the agency registered,
// /login auto-routes here and we show contracts linked by email.
// No on-chain action from this side; the agency runs the advance and PIX-off-ramp
// in production. This screen is a status portal.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { AppShell, type Tab } from "../../components/shell/AppShell";
import { I } from "../../components/icons";
import { Card } from "../../components/primitives/Card";
import { Pill } from "../../components/primitives/Pill";
import { useT } from "../../lib/i18n";
import { getPersona } from "../../lib/persona";
import { fmtBRZ, fmtPct } from "../../lib/mock-data";
import {
  getAgencyApplication,
  getClientByEmail,
  getContractsByClientId,
  type AgencyApplication,
  type AgencyClient,
  type AgencyContract,
} from "../../lib/agency-clients";

type TabId = "overview" | "history";

export default function LandlordPage() {
  const { t } = useT();
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [tab, setTab] = useState<TabId>("overview");
  const [client, setClient] = useState<AgencyClient | null>(null);
  const [contracts, setContracts] = useState<AgencyContract[]>([]);
  const [agencyApp, setAgencyApp] = useState<AgencyApplication | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.push("/login");
      return;
    }
    if (getPersona() !== "landlord") {
      router.push("/login");
      return;
    }
    const email =
      user?.email?.address ??
      (
        user?.linkedAccounts.find((a) => a.type === "email") as
          | { address?: string }
          | undefined
      )?.address;
    if (email) {
      const c = getClientByEmail(email);
      setClient(c);
      if (c) setContracts(getContractsByClientId(c.id));
    }
    setAgencyApp(getAgencyApplication());
    setHydrated(true);
  }, [ready, authenticated, user, router]);

  const tabs: Tab[] = [
    { id: "overview", label: t("ll_tab_overview") as string },
    { id: "history", label: t("ll_tab_history") as string },
  ];

  return (
    <AppShell
      persona="landlord"
      tabs={tabs}
      activeTab={tab}
      setActiveTab={(id) => setTab(id as TabId)}
    >
      {!hydrated ? null : !client ? (
        <NotLinked />
      ) : tab === "overview" ? (
        <Overview client={client} contracts={contracts} agencyApp={agencyApp} />
      ) : (
        <History contracts={contracts} />
      )}
    </AppShell>
  );
}

// ─── Not linked yet ─────────────────────────────────────────────────────────
function NotLinked() {
  const { t } = useT();
  return (
    <div className="fade-in" style={{ maxWidth: 540, margin: "60px auto" }}>
      <Card style={{ padding: 32, textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            margin: "0 auto 20px",
            background: "var(--bg-2)",
            color: "var(--fg-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <I.building size={26} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 8px" }}>
          {t("ll_not_linked_h") as string}
        </h2>
        <p
          style={{
            color: "var(--fg-2)",
            fontSize: 14,
            margin: "0 0 20px",
            lineHeight: 1.6,
          }}
        >
          {t("ll_not_linked_p") as string}
        </p>
        <Link href="/" className="btn btn-secondary">
          {t("nav_back_site") as string}
        </Link>
      </Card>
    </div>
  );
}

// ─── Partner agency card ────────────────────────────────────────────────────
function PartnerCard({ agencyApp }: { agencyApp: AgencyApplication | null }) {
  const { t } = useT();
  const name = agencyApp?.companyName ?? "—";
  return (
    <Card style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            background: "var(--gold-soft)",
            color: "var(--gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <I.shield size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
            {t("ll_partner") as string}
          </div>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{name}</span>
          </div>
        </div>
        {agencyApp?.city && (
          <div style={{ textAlign: "right" }}>
            <div
              className="mono"
              style={{ fontSize: 11, color: "var(--fg-3)" }}
            >
              {t("ll_partner_city") as string}
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{agencyApp.city}</div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────
function Overview({
  client,
  contracts,
  agencyApp,
}: {
  client: AgencyClient;
  contracts: AgencyContract[];
  agencyApp: AgencyApplication | null;
}) {
  const { t } = useT();

  const active = useMemo(
    () =>
      contracts.filter(
        (c) => c.status === "funded" || c.status === "registered",
      ),
    [contracts],
  );
  const totalAdvanced = active.reduce((s, c) => s + c.principalBrz, 0);
  const lastFunded = active.find((c) => c.status === "funded");

  return (
    <div className="fade-in" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--fg-2)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {t("ll_greet") as string}, {client.name}
        </div>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            margin: "8px 0 0",
            textWrap: "pretty" as const,
          }}
        >
          {active.length === 0
            ? (t("ll_h1_empty") as string)
            : (t("ll_h1_active") as string)}
        </h1>
      </div>

      <PartnerCard agencyApp={agencyApp} />

      {active.length === 0 ? (
        <Card style={{ padding: 32, textAlign: "center" }}>
          <p style={{ color: "var(--fg-2)", margin: 0 }}>
            {t("ll_no_active") as string}
          </p>
        </Card>
      ) : (
        <>
          <Card
            style={{
              marginBottom: 16,
              padding: 24,
              background:
                "linear-gradient(135deg, var(--gold-soft) 0%, var(--bg-1) 100%)",
              borderColor: "var(--gold)",
            }}
          >
            <div className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
              {t("ll_total_received") as string}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 40,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "var(--gold)",
                marginTop: 4,
              }}
            >
              {fmtBRZ(totalAdvanced)}
            </div>
            {lastFunded && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: "var(--fg-2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <I.check size={14} />
                {t("ll_pix_sent") as string}
                {client.pixKey ? (
                  <span className="mono" style={{ color: "var(--fg-1)" }}>
                    {client.pixKey.length > 24
                      ? client.pixKey.slice(0, 24) + "…"
                      : client.pixKey}
                  </span>
                ) : null}
              </div>
            )}
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {active.map((c) => (
              <ContractCard key={c.id} c={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── History ────────────────────────────────────────────────────────────────
function History({ contracts }: { contracts: AgencyContract[] }) {
  const { t } = useT();
  const past = contracts.filter(
    (c) => c.status === "repaid" || c.status === "defaulted",
  );
  return (
    <div className="fade-in" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: "0 0 24px",
        }}
      >
        {t("ll_history_h") as string}
      </h1>
      {past.length === 0 ? (
        <Card style={{ padding: 32, textAlign: "center" }}>
          <p style={{ color: "var(--fg-2)", margin: 0 }}>
            {t("ll_history_empty") as string}
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {past.map((c) => (
            <ContractCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Contract card ──────────────────────────────────────────────────────────
function ContractCard({ c }: { c: AgencyContract }) {
  const { t } = useT();
  const apr = c.rateBps / 10_000;
  const progress =
    c.installmentsTotal > 0
      ? Math.round((c.installmentsPaid / c.installmentsTotal) * 100)
      : 0;
  return (
    <Card style={{ padding: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>
            {c.id}
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, marginTop: 2 }}>
            {c.propertyAddress}
          </div>
        </div>
        <Pill status={c.status}>{c.status}</Pill>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          fontSize: 13,
          marginBottom: c.status === "funded" ? 14 : 0,
        }}
      >
        <Cell l={t("cell_advanced") as string} v={fmtBRZ(c.principalBrz)} mono />
        <Cell l={t("cell_rate") as string} v={fmtPct(apr)} accent mono />
        <Cell
          l={t("cell_installments") as string}
          v={`${c.installmentsPaid} / ${c.installmentsTotal}`}
          mono
        />
        <Cell
          l={t("cell_insurance") as string}
          v={
            c.hasInsurance
              ? c.insurer ?? (t("cell_insurance_active") as string)
              : "—"
          }
        />
      </div>
      {c.status === "funded" && (
        <>
          <div
            style={{
              height: 6,
              background: "var(--bg-2)",
              borderRadius: 3,
              overflow: "hidden",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "var(--gold)",
                borderRadius: 3,
              }}
            />
          </div>
          <div
            className="mono"
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--fg-2)",
            }}
          >
            <span>{progress}%</span>
            <span>
              {t("ll_repayment_total") as string}: {fmtBRZ(c.repaymentBrz)}
            </span>
          </div>
        </>
      )}
      {c.fundSig && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--line-soft)",
            fontSize: 12,
            color: "var(--fg-3)",
          }}
        >
          <a
            href={`https://explorer.solana.com/tx/${c.fundSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--fg-2)", display: "inline-flex", gap: 4 }}
          >
            <I.link size={12} /> {t("ll_view_tx") as string}
          </a>
        </div>
      )}
    </Card>
  );
}

function Cell({
  l,
  v,
  accent,
  mono,
}: {
  l: string;
  v: string;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: "var(--fg-2)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {l}
      </div>
      <div
        className={mono ? "mono" : undefined}
        style={{
          marginTop: 4,
          color: accent ? "var(--gold)" : "var(--fg-0)",
          fontWeight: 500,
        }}
      >
        {v}
      </div>
    </div>
  );
}
