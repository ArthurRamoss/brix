"use client";

// /landlord — Property owner POV.
// Tabs: overview (snapshot of one funded contract) / simulate / contracts (read-only).
// register_receivable + fund_landlord moved to /agency.
// Ported from Brix-handoff/brix/project/landlord.jsx.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { AppShell, type Tab } from "../../components/shell/AppShell";
import { I } from "../../components/icons";
import { KPI } from "../../components/primitives/KPI";
import { Card } from "../../components/primitives/Card";
import { Pill } from "../../components/primitives/Pill";
import { useT } from "../../lib/i18n";
import { getPersona } from "../../lib/persona";
import {
  RECEIVABLES,
  fmtBRZ,
  fmtPct,
  type ProtoReceivable,
} from "../../lib/mock-data";

type TabId = "overview" | "simulate" | "contracts";

export default function LandlordPage() {
  const { t } = useT();
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.push("/login");
      return;
    }
    if (getPersona() !== "landlord") router.push("/login");
  }, [ready, authenticated, router]);

  const tabs: Tab[] = [
    { id: "overview", label: t("ll_tab_overview") as string },
    { id: "simulate", label: t("ll_tab_simulate") as string },
    { id: "contracts", label: t("ll_tab_contracts") as string },
  ];

  return (
    <AppShell
      persona="landlord"
      tabs={tabs}
      activeTab={tab}
      setActiveTab={(id) => setTab(id as TabId)}
    >
      {tab === "overview" && <Overview setTab={setTab} />}
      {tab === "simulate" && <Simulator />}
      {tab === "contracts" && <Contracts />}
    </AppShell>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────
function Overview({ setTab }: { setTab: (id: TabId) => void }) {
  const { t } = useT();
  const repayFn = t("ll_repay_progress") as unknown as (
    a: number,
    b: number,
  ) => string;
  return (
    <div className="fade-in" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--fg-2)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {t("ll_greet") as string}
        </div>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            margin: "8px 0 0",
            textWrap: "pretty" as const,
          }}
        >
          {t("ll_overview_h1_a") as string}{" "}
          <span style={{ color: "var(--gold)" }}>BRZ 8.702</span>{" "}
          {t("ll_overview_h1_b") as string}
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <KPI
          label={t("ll_kpi1_l") as string}
          value="BRZ 9.600"
          sub={t("ll_kpi1_s") as string}
          tone="gold"
        />
        <KPI
          label={t("ll_kpi2_l") as string}
          value={t("ll_kpi2_v") as string}
          sub={t("ll_kpi2_s") as string}
          mono
        />
        <KPI
          label={t("ll_kpi3_l") as string}
          value={t("ll_kpi3_v") as string}
          sub={t("ll_kpi3_s") as string}
          tone="green"
        />
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {t("ll_repay_h") as string}
          </h3>
          <Pill status="funded">funded</Pill>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <span className="mono" style={{ fontSize: 32, fontWeight: 500 }}>
            4 / 6
          </span>
          <span style={{ color: "var(--fg-2)", fontSize: 14 }}>
            {t("ll_repay_paid") as string}
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: "var(--bg-2)",
            borderRadius: 3,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: "66.6%",
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
          <span>{repayFn(6400, 9600)}</span>
          <span>
            {t("ll_repay_next") as string}: 05 mai · BRZ 1.600
          </span>
        </div>
      </Card>

      <button
        onClick={() => setTab("simulate")}
        className="btn btn-primary btn-lg"
        style={{ width: "100%" }}
      >
        {t("ll_simulate_cta") as string} <I.arrow size={16} />
      </button>
    </div>
  );
}

// ─── Simulator ──────────────────────────────────────────────────────────────
function Simulator() {
  const { t } = useT();
  const [rent, setRent] = useState(2400);
  const [months, setMonths] = useState(6);
  const [submitted, setSubmitted] = useState(false);

  const apr = 0.18 + Math.max(0, months - 3) * 0.004;
  const total = rent * months;
  const fee = total * apr * (months / 12);
  const youGet = total - fee;
  const monthlyRepay = total / months;

  if (submitted) {
    return (
      <div className="fade-in" style={{ maxWidth: 720, margin: "40px auto" }}>
        <div
          style={{
            padding: 40,
            borderRadius: "var(--radius-xl)",
            background: "var(--bg-1)",
            border: "1px solid var(--gold)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: "var(--gold-soft)",
              color: "var(--gold)",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <I.check size={28} />
          </div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: "0 0 8px",
            }}
          >
            {t("sim_done_h") as string}
          </h2>
          <p style={{ color: "var(--fg-1)", fontSize: 15, margin: "0 0 24px" }}>
            {t("sim_done_p_a") as string}{" "}
            {fmtBRZ(youGet).replace("BRZ ", "")}{" "}
            {t("sim_done_p_b") as string}
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="btn btn-secondary"
          >
            {t("sim_done_again") as string}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: "0 0 8px",
        }}
      >
        {t("sim_h1") as string}
      </h1>
      <p style={{ color: "var(--fg-2)", fontSize: 14, margin: "0 0 32px" }}>
        {t("sim_sub") as string}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        <Card>
          <div style={{ marginBottom: 24 }}>
            <label className="label">{t("sim_rent_l") as string}</label>
            <div style={{ position: "relative" }}>
              <span
                className="mono"
                style={{
                  position: "absolute",
                  left: 16,
                  top: 14,
                  color: "var(--fg-3)",
                  fontSize: 16,
                }}
              >
                BRZ
              </span>
              <input
                type="number"
                value={rent}
                onChange={(e) => setRent(+e.target.value || 0)}
                className="field tnum mono"
                style={{ paddingLeft: 56 }}
              />
            </div>
            <input
              type="range"
              min={800}
              max={12000}
              step={100}
              value={rent}
              onChange={(e) => setRent(+e.target.value)}
              style={{
                width: "100%",
                marginTop: 12,
                accentColor: "oklch(0.82 0.16 75)",
              }}
            />
          </div>
          <div>
            <label className="label">{t("sim_months_l") as string}</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 6,
                marginTop: 4,
              }}
            >
              {[3, 6, 8, 10, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className="mono"
                  style={{
                    padding: "12px 0",
                    fontSize: 14,
                    fontWeight: 500,
                    background: months === m ? "var(--gold)" : "var(--bg-2)",
                    color:
                      months === m ? "oklch(0.18 0.02 75)" : "var(--fg-1)",
                    border:
                      "1px solid " +
                      (months === m ? "var(--gold)" : "var(--line)"),
                    borderRadius: "var(--radius)",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div
            style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: "1px solid var(--line-soft)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 12,
              color: "var(--fg-2)",
            }}
          >
            <I.shieldCheck size={16} />
            <span>{t("sim_insurance_note") as string}</span>
          </div>
        </Card>

        <div
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--gold)",
            borderRadius: "var(--radius-lg)",
            padding: 28,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            className="mono"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              padding: "6px 12px",
              background: "var(--gold)",
              color: "oklch(0.18 0.02 75)",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              borderBottomLeftRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <I.lock size={12} /> {t("sim_immutable") as string}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "var(--fg-2)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            {t("sim_you_get") as string}
          </div>
          <div
            className="mono"
            style={{
              fontSize: 48,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "var(--gold)",
              lineHeight: 1,
            }}
          >
            {fmtBRZ(youGet)}
          </div>
          <div
            className="mono"
            style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 8 }}
          >
            {t("sim_eta") as string}
          </div>

          <div
            className="mono"
            style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid var(--line-soft)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              fontSize: 13,
            }}
          >
            <Row l={t("sim_r_assigned") as string} r={`${months} × ${fmtBRZ(rent)}`} />
            <Row l={t("sim_r_total") as string} r={fmtBRZ(total)} />
            <Row l={t("sim_r_apr") as string} r={fmtPct(apr)} accent />
            <Row l={t("sim_r_cost") as string} r={`-${fmtBRZ(fee)}`} />
            <Row l={t("sim_r_monthly") as string} r={fmtBRZ(monthlyRepay)} />
          </div>

          <button
            onClick={() => setSubmitted(true)}
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: 24 }}
          >
            {t("sim_submit") as string} <I.arrow size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ l, r, accent }: { l: string; r: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
      }}
    >
      <span style={{ color: "var(--fg-2)" }}>{l}</span>
      <span
        style={{
          color: accent ? "var(--gold)" : "var(--fg-0)",
          fontWeight: accent ? 600 : 400,
        }}
      >
        {r}
      </span>
    </div>
  );
}

// ─── Contracts (read-only) ──────────────────────────────────────────────────
function Contracts() {
  const { t } = useT();
  // For demo: filter receivables by a single landlord identity. Real version would
  // call program.account.receivable.all() filtered by landlord wallet — out of
  // scope for MVP since seed-demo populates with a fixed demo landlord anyway.
  const mine = RECEIVABLES.filter(
    (r) => r.landlord === "Marina Toledo" || r.id === "BRX-0421",
  );
  const fallback = RECEIVABLES[5];
  const list = mine.length > 0 ? [...mine, fallback] : [fallback];

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
        {t("contracts_h") as string}
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {list.map((r, i) => (
          <ContractRow key={`${r.id}-${i}`} r={r} />
        ))}
      </div>
    </div>
  );
}

function ContractRow({ r }: { r: ProtoReceivable }) {
  const { t } = useT();
  return (
    <Card style={{ padding: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>
            {r.id}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {r.address}
          </div>
        </div>
        <Pill status={r.status}>{r.status}</Pill>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          fontSize: 13,
        }}
      >
        <Cell l={t("cell_advanced") as string} v={fmtBRZ(r.amount)} mono />
        <Cell l={t("cell_rate") as string} v={fmtPct(r.rate)} accent mono />
        <Cell l={t("cell_installments") as string} v={`${r.paid} / ${r.total}`} mono />
        <Cell
          l={t("cell_insurance") as string}
          v={r.fee ? (t("cell_insurance_active") as string) : "—"}
        />
      </div>
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
