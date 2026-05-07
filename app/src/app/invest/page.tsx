"use client";

// /invest — Investor portal (re-skin).
// Same on-chain wiring as before (useBrix), new design system shell.
// Tabs: vault dashboard / deposit / withdraw / positions.
// Ported from Brix-handoff/brix/project/investor.jsx.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { AppShell, type Tab } from "../../components/shell/AppShell";
import { I } from "../../components/icons";
import { KPI } from "../../components/primitives/KPI";
import { Card } from "../../components/primitives/Card";
import { TVLChart } from "../../components/primitives/TVLChart";
import { useT } from "../../lib/i18n";
import { getPersona } from "../../lib/persona";
import { fmtBRZ, fmtPct, TVL_SERIES } from "../../lib/mock-data";
import {
  getAgencyContracts,
  type AgencyContract,
} from "../../lib/agency-clients";
import { useBrix } from "../../hooks/use-brix";

type TabId = "vault" | "deposit" | "withdraw" | "positions";

export default function InvestPage() {
  const { t } = useT();
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [tab, setTab] = useState<TabId>("vault");

  // Auth + persona guard. Privy may not be configured (build w/o env) — only redirect when ready.
  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.push("/login");
      return;
    }
    const persona = getPersona();
    if (persona !== "invest") router.push("/login");
  }, [ready, authenticated, router]);

  const tabs: Tab[] = [
    { id: "vault", label: t("inv_tab_vault") as string },
    { id: "deposit", label: t("inv_tab_deposit") as string },
    { id: "withdraw", label: t("inv_tab_withdraw") as string },
    { id: "positions", label: t("inv_tab_positions") as string },
  ];

  return (
    <AppShell
      persona="invest"
      tabs={tabs}
      activeTab={tab}
      setActiveTab={(id) => setTab(id as TabId)}
    >
      {tab === "vault" && <VaultDashboard setTab={setTab} />}
      {tab === "deposit" && <DepositTab />}
      {tab === "withdraw" && <WithdrawTab />}
      {tab === "positions" && <PositionsTab />}
    </AppShell>
  );
}

// ─── Vault dashboard ─────────────────────────────────────────────────────────
function VaultDashboard({ setTab }: { setTab: (id: TabId) => void }) {
  const { t } = useT();
  const { vaultData } = useBrix();
  const [funded, setFunded] = useState<AgencyContract[]>([]);

  useEffect(() => {
    setFunded(getAgencyContracts().filter((c) => c.status === "funded"));
  }, []);

  // On-chain values; 0 when vault not yet seeded on devnet (empty state shows).
  const tvl =
    vaultData != null ? Number(vaultData.totalAssets) / 1_000_000 : 0;
  const aprBps = vaultData?.aprBps ?? 0;
  const apr = aprBps / 10_000;

  const fundedCount = funded.length;
  const utilization =
    vaultData && Number(vaultData.totalAssets) > 0
      ? Number(vaultData.totalDeployed) / Number(vaultData.totalAssets)
      : 0;
  const utilCount = Math.round(utilization * Math.max(1, fundedCount));

  const kpiUtilSub = (t("inv_kpi_util_s") as unknown as (n: number) => string)(
    utilCount,
  );
  const backingCount = (t("inv_backing_count") as unknown as (
    n: number,
  ) => string)(fundedCount);

  return (
    <div className="fade-in" style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--fg-2)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="dot" style={{ color: "var(--teal)" }} />
          {t("inv_kicker") as string}
        </div>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            margin: "8px 0 0",
          }}
        >
          {(tvl > 0
            ? (t("inv_h1_active") as string)
            : (t("inv_h1_empty") as string))}
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card style={{ padding: 28, position: "relative", overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fg-2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                {t("inv_tvl_l") as string}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 56,
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  color: "var(--teal)",
                  lineHeight: 1,
                }}
              >
                {fmtBRZ(tvl)}
              </div>
              {tvl > 0 && (
                <div
                  className="mono"
                  style={{ marginTop: 10, fontSize: 13, color: "var(--green)" }}
                >
                  {t("inv_tvl_delta") as string}
                </div>
              )}
            </div>
            <div
              style={{
                padding: "10px 14px",
                background: "var(--teal-soft)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--teal-line)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fg-2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {t("inv_apr_30d") as string}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 22,
                  color: "var(--teal)",
                  fontWeight: 500,
                }}
              >
                {fmtPct(apr)}
              </div>
            </div>
          </div>

          <TVLChart series={TVL_SERIES} mult={tvl > 0 ? 1 : 0} />
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <KPI
            label={t("inv_kpi_util") as string}
            value={fmtPct(utilization)}
            sub={kpiUtilSub}
            mono
            tone="gold"
          />
          <Card style={{ padding: 20 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--fg-2)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 12,
              }}
            >
              {t("inv_actions") as string}
            </div>
            <button
              onClick={() => setTab("deposit")}
              className="btn btn-teal"
              style={{ width: "100%", marginBottom: 8 }}
            >
              <I.plus size={14} /> {t("inv_deposit_cta") as string}
            </button>
            <button
              onClick={() => setTab("withdraw")}
              className="btn btn-secondary"
              style={{ width: "100%" }}
            >
              <I.download size={14} /> {t("inv_withdraw_cta") as string}
            </button>
          </Card>
          <KPI
            label={t("inv_kpi_active") as string}
            value={String(fundedCount)}
            sub={
              fundedCount === 0
                ? (t("inv_kpi_active_s_empty") as string)
                : (t("inv_kpi_active_s") as unknown as (n: number) => string)(
                    fundedCount,
                  )
            }
            tone="green"
            mono
          />
        </div>
      </div>

      {/* Active receivables backing the vault */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--line-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {t("inv_backing_h") as string}
          </h3>
          <span
            className="mono"
            style={{ fontSize: 12, color: "var(--fg-2)" }}
          >
            {backingCount}
          </span>
        </div>
        <div>
          <div
            className="mono"
            style={{
              display: "grid",
              gridTemplateColumns: "110px 1.4fr 1fr 100px 80px 100px",
              padding: "10px 20px",
              fontSize: 11,
              color: "var(--fg-2)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <span>{t("ag_th_id") as string}</span>
            <span>{t("inv_th_property") as string}</span>
            <span>{t("inv_th_city") as string}</span>
            <span>{t("ag_th_value") as string}</span>
            <span>{t("ag_th_rate") as string}</span>
            <span>{t("ag_th_inst") as string}</span>
          </div>
          {funded.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                fontSize: 13,
                color: "var(--fg-3)",
              }}
            >
              {t("inv_backing_empty") as string}
            </div>
          ) : (
            funded.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "110px 1.4fr 1fr 100px 80px 100px",
                  padding: "14px 20px",
                  fontSize: 14,
                  borderTop: "1px solid var(--line-soft)",
                  alignItems: "center",
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 12, color: "var(--fg-2)" }}
                >
                  {c.id}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.propertyAddress.split(",")[0]}
                </span>
                <span style={{ color: "var(--fg-1)", fontSize: 13 }}>
                  {c.propertyAddress.split(",").slice(-1)[0]?.trim() || "—"}
                </span>
                <span className="mono">{fmtBRZ(c.principalBrz)}</span>
                <span className="mono" style={{ color: "var(--teal)" }}>
                  {fmtPct(c.rateBps / 10_000)}
                </span>
                <span className="mono" style={{ color: "var(--fg-1)" }}>
                  {c.installmentsPaid}/{c.installmentsTotal}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Deposit ────────────────────────────────────────────────────────────────
function DepositTab() {
  const { t } = useT();
  const { vaultData, deposit, isLoading } = useBrix();
  const [amt, setAmt] = useState(1000);

  // Share price derived from vault state when available.
  const sharePrice = useMemo(() => {
    if (!vaultData) return 1.0274;
    const totalShares = Number(vaultData.totalShares);
    const totalAssets = Number(vaultData.totalAssets);
    if (totalShares === 0) return 1.0;
    return totalAssets / totalShares;
  }, [vaultData]);

  const shares = sharePrice > 0 ? amt / sharePrice : 0;

  return (
    <div className="fade-in" style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: "0 0 8px",
        }}
      >
        {t("dep_h1") as string}
      </h1>
      <p
        style={{
          color: "var(--fg-2)",
          fontSize: 14,
          margin: "0 0 28px",
        }}
      >
        {t("dep_sub") as string}
      </p>

      <Card style={{ borderColor: "var(--teal-line)" }}>
        <label className="label">{t("dep_amount_l") as string}</label>
        <div style={{ position: "relative" }}>
          <span
            className="mono"
            style={{
              position: "absolute",
              left: 16,
              top: 18,
              color: "var(--fg-3)",
            }}
          >
            BRZ
          </span>
          <input
            type="number"
            value={amt}
            onChange={(e) => setAmt(+e.target.value || 0)}
            className="field tnum mono"
            style={{
              paddingLeft: 60,
              fontSize: 22,
              padding: "18px 16px 18px 60px",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {[100, 500, 1000, 5000, "max"].map((v) => (
            <button
              key={String(v)}
              onClick={() => setAmt(v === "max" ? 12340 : (v as number))}
              className="mono"
              style={{
                flex: 1,
                padding: "8px 0",
                fontSize: 12,
                background: "var(--bg-2)",
                border: "1px solid var(--line)",
                borderRadius: 6,
                color: "var(--fg-1)",
              }}
            >
              {v === "max" ? "max" : `BRZ ${v}`}
            </button>
          ))}
        </div>

        <div
          className="mono"
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: "1px solid var(--line-soft)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontSize: 13,
          }}
        >
          <Row2 l={t("dep_share_price") as string} r={`${sharePrice.toFixed(4)} BRZ`} />
          <Row2 l={t("dep_shares_est") as string} r={`${shares.toFixed(2)} brxV`} accent />
          <Row2 l={t("dep_apr_exp") as string} r={fmtPct(0.197)} />
          <Row2 l={t("dep_lockup") as string} r={t("dep_lockup_v") as string} />
        </div>

        <button
          onClick={() => deposit(amt)}
          disabled={isLoading || amt <= 0}
          className="btn btn-teal btn-lg"
          style={{ width: "100%", marginTop: 24 }}
        >
          {isLoading ? "…" : (t("dep_confirm") as string)} <I.arrow size={16} />
        </button>
        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            color: "var(--fg-3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "center",
          }}
        >
          <I.shieldCheck size={12} /> {t("dep_signed") as string}
        </div>
      </Card>
    </div>
  );
}

// ─── Withdraw ───────────────────────────────────────────────────────────────
function WithdrawTab() {
  const { t } = useT();
  const { positionData, vaultData, withdraw, isLoading } = useBrix();

  const sharePrice = useMemo(() => {
    if (!vaultData) return 1.0274;
    const totalShares = Number(vaultData.totalShares);
    const totalAssets = Number(vaultData.totalAssets);
    if (totalShares === 0) return 1.0;
    return totalAssets / totalShares;
  }, [vaultData]);

  // Convert lamports to whole shares for the input.
  const maxShares = positionData ? Number(positionData.shares) / 1_000_000 : 0;
  const [amt, setAmt] = useState<number | null>(null);

  const selectedAmt = amt ?? (maxShares > 0 ? Math.min(500, maxShares) : 0);
  const youGet = selectedAmt * sharePrice;
  const overMax = selectedAmt > maxShares;

  const onConfirm = async () => {
    if (overMax || selectedAmt <= 0) return;
    // Convert displayed shares back to lamports.
    const sharesLamports = BigInt(Math.floor(selectedAmt * 1_000_000));
    await withdraw(sharesLamports);
  };

  return (
    <div className="fade-in" style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: "0 0 8px",
        }}
      >
        {t("wd_h1") as string}
      </h1>
      <p style={{ color: "var(--fg-2)", fontSize: 14, margin: "0 0 28px" }}>
        {t("wd_sub") as string}
      </p>

      <Card>
        <label className="label">{t("wd_shares_l") as string}</label>
        <input
          type="number"
          value={selectedAmt}
          onChange={(e) => setAmt(+e.target.value || 0)}
          className="field tnum mono"
          style={{ fontSize: 22, padding: "18px 16px" }}
        />
        <div
          className="mono"
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--fg-2)",
            marginTop: 8,
          }}
        >
          <span>
            {t("wd_available") as string}: {maxShares.toFixed(2)} brxV
          </span>
          <button onClick={() => setAmt(maxShares)} style={{ color: "var(--teal)" }}>
            {t("wd_max") as string}
          </button>
        </div>

        <div
          className="mono"
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: "1px solid var(--line-soft)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontSize: 13,
          }}
        >
          <Row2 l={t("wd_you_get") as string} r={fmtBRZ(youGet)} accent />
          <Row2 l={t("wd_gas") as string} r="~ BRZ 0,02" />
        </div>

        <button
          onClick={onConfirm}
          disabled={isLoading || overMax || selectedAmt <= 0}
          className="btn btn-secondary btn-lg"
          style={{ width: "100%", marginTop: 24 }}
        >
          {overMax
            ? (t("wd_insufficient") as string)
            : (t("wd_confirm") as string)}
        </button>
      </Card>
    </div>
  );
}

// ─── Positions ──────────────────────────────────────────────────────────────
function PositionsTab() {
  const { t } = useT();
  const { positionData } = useBrix();

  // Derive numbers from real on-chain position; 0 when not yet deposited.
  const deposited = positionData
    ? Number(positionData.totalDeposited) / 1_000_000
    : 0;
  const value = positionData
    ? Number(positionData.estimatedValueBrz) / 1_000_000
    : 0;
  const sharesNum = positionData ? Number(positionData.shares) / 1_000_000 : 0;
  const yieldPct = deposited > 0 ? (value - deposited) / deposited : 0;

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
        {t("pos_h1") as string}
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <KPI
          label={t("pos_kpi_dep") as string}
          value={fmtBRZ(deposited)}
          sub={t("pos_kpi_dep_s") as string}
          mono
        />
        <KPI
          label={t("pos_kpi_value") as string}
          value={fmtBRZ(value)}
          sub={`+${fmtBRZ(value - deposited)}`}
          tone="gold"
          mono
        />
        <KPI
          label={t("pos_kpi_yield") as string}
          value={`+${fmtPct(yieldPct)}`}
          sub={t("pos_kpi_yield_s") as string}
          tone="green"
          mono
        />
        <KPI
          label={t("pos_kpi_shares") as string}
          value={sharesNum.toFixed(2)}
          sub="brxV"
          mono
        />
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--line-soft)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {t("pos_history_h") as string}
          </h3>
        </div>
        <div
          style={{
            padding: 32,
            textAlign: "center",
            fontSize: 13,
            color: "var(--fg-3)",
          }}
        >
          {deposited > 0
            ? (t("pos_history_pending") as string)
            : (t("pos_history_empty") as string)}
        </div>
      </Card>
    </div>
  );
}

function Row2({ l, r, accent }: { l: string; r: string; accent?: boolean }) {
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
          color: accent ? "var(--teal)" : "var(--fg-0)",
          fontWeight: accent ? 600 : 400,
        }}
      >
        {r}
      </span>
    </div>
  );
}
