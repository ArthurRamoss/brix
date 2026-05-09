"use client";

// /invest — Investor portal (re-skin).
// Same on-chain wiring as before (useBrix), new design system shell.
// Tabs: vault dashboard / deposit / withdraw / positions.
// Ported from Brix-handoff/brix/project/investor.jsx.

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { AppShell, type Tab } from "../../components/shell/AppShell";
import { I } from "../../components/icons";
import { KPI } from "../../components/primitives/KPI";
import { Card } from "../../components/primitives/Card";
import { TVLChart } from "../../components/primitives/TVLChart";
import { useT } from "../../lib/i18n";
import { getPersona } from "../../lib/persona";
import { fmtBRZ, fmtPct } from "../../lib/mock-data";
import {
  getAgencyContracts,
  listVaultEvents,
  type AgencyContract,
  type VaultEvent,
} from "../../lib/agency-clients";
import { RecentEvents } from "../../components/primitives/RecentEvents";
import { useBrix } from "../../hooks/use-brix";

type TabId = "vault" | "deposit" | "withdraw" | "positions";
const VALID_TABS: TabId[] = ["vault", "deposit", "withdraw", "positions"];

function readEmail(user: ReturnType<typeof usePrivy>["user"]): string | null {
  return (
    user?.email?.address ??
    (
      user?.linkedAccounts.find((a) => a.type === "email") as
        | { address?: string }
        | undefined
    )?.address ??
    null
  );
}

export default function InvestPage() {
  const { t } = useT();
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();

  // Prefetch with priority order. We kick off all data the investor portal
  // needs as soon as the page mounts, but we stagger so the vault tab (the
  // default landing tab) gets the first RPC slot. When the user clicks any
  // other tab the data is already in cache — no flash, no spinner.
  //
  // Priority 1 (fired now): contracts + global vault events → VaultDashboard
  // Priority 2 (next microtask): per-user vault events → PositionsTab
  // Vault + position data themselves are fetched by useBrix's effects when
  // their consumers mount; the module singleton dedups across tabs.
  useEffect(() => {
    void getAgencyContracts();
    void listVaultEvents({ limit: 200 });

    void Promise.resolve().then(() => {
      const email = readEmail(user);
      if (email) {
        void listVaultEvents({ email, limit: 200 });
      }
    });
  }, [user]);

  // Tab is in-memory state (no URL noise on click). On first mount we still
  // honor `?tab=...` so deep links from /history keep working — then we
  // strip the query so subsequent tab clicks don't desync the URL.
  const [tab, setTab] = useState<TabId>("vault");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get("tab");
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as TabId)) {
      setTab(tabFromUrl as TabId);
      params.delete("tab");
      const qs = params.toString();
      const cleanUrl = window.location.pathname + (qs ? `?${qs}` : "");
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);

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
  const { user } = usePrivy();
  const { vaultData } = useBrix();
  const [funded, setFunded] = useState<AgencyContract[]>([]);
  const [events, setEvents] = useState<VaultEvent[]>([]);

  const email =
    user?.email?.address ??
    (
      user?.linkedAccounts.find((a) => a.type === "email") as
        | { address?: string }
        | undefined
    )?.address ??
    null;

  useEffect(() => {
    void (async () => {
      const [all, ev] = await Promise.all([
        getAgencyContracts(),
        listVaultEvents({ limit: 200 }),
      ]);
      setFunded(all.filter((c) => c.status === "funded"));
      setEvents(ev);
    })();
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

  // TVL chart series — derived from real vault_events. Each event's
  // vaultTvlBrzAfter is plotted at its day offset from now (negative =
  // past, 0 = today). Time-based d so the chart scales proportionally to
  // elapsed time instead of event count, which keeps realized and
  // projected portions visually balanced. A synthetic point at d=0 is
  // appended so the realized line carries the last TVL horizontally until
  // "now", meeting the projection at the today marker.
  const tvlSeries = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const points = events
      .filter((e) => typeof e.vaultTvlBrzAfter === "number")
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((e) => ({
        d: Math.floor((e.createdAt - now) / dayMs),
        value: e.vaultTvlBrzAfter as number,
      }));
    if (points.length === 0) return points;
    const lastPoint = points[points.length - 1];
    if (lastPoint.d < 0) {
      points.push({ d: 0, value: lastPoint.value });
    }
    return points;
  }, [events]);

  // 24h delta — last event's TVL minus the latest event TVL from 24h+ ago.
  // null when there's not enough history (chart card hides the line then).
  const delta24h = useMemo(() => {
    if (tvlSeries.length === 0) return null;
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const sorted = [...events]
      .filter((e) => typeof e.vaultTvlBrzAfter === "number")
      .sort((a, b) => a.createdAt - b.createdAt);
    if (sorted.length === 0) return null;
    const latest = sorted[sorted.length - 1].vaultTvlBrzAfter as number;
    const before = sorted.find((e) => e.createdAt >= cutoff);
    if (!before) {
      // First event was within the last 24h — use the very first as baseline.
      const baseline = sorted[0].vaultTvlBrzAfter as number;
      return latest - baseline;
    }
    const baseline = before.vaultTvlBrzAfter as number;
    return latest - baseline;
  }, [events, tvlSeries.length]);

  // Projected TVL series — stitches future expected vault inflows from
  // active contracts. For each funded contract, the remaining installments
  // are spread evenly across the months ahead and each one bumps the
  // projected TVL by `repaymentBrz / installmentsTotal`. Sampled daily so
  // the chart curve is dense (real installments still drive the steps;
  // empty days fill in the plateau between them). Rendered as a dashed
  // continuation of the historical chart.
  const projectionSeries = useMemo(() => {
    if (tvlSeries.length === 0) return [];
    const lastTvl = tvlSeries[tvlSeries.length - 1].value;
    const active = funded.filter(
      (c) => c.installmentsPaid < c.installmentsTotal,
    );
    if (active.length === 0) return [];

    // Build a sorted timeline of expected inflows in BRZ.
    const inflows: { ts: number; amount: number }[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    for (const c of active) {
      const installmentBrz = c.repaymentBrz / c.installmentsTotal;
      const remaining = c.installmentsTotal - c.installmentsPaid;
      const intervalDays = Math.max(1, Math.floor(c.durationDays / c.installmentsTotal));
      for (let i = 0; i < remaining; i++) {
        const ts = now + (i + 1) * intervalDays * dayMs;
        inflows.push({ ts, amount: installmentBrz });
      }
    }
    inflows.sort((a, b) => a.ts - b.ts);
    if (inflows.length === 0) return [];

    // Sample daily across the full projection window so the dashed line has
    // visual density — each day either repeats the previous TVL (a plateau)
    // or bumps up by the installments that landed that day. d=0 marks today
    // (matching tvlSeries' time base) so realized and projected line up at
    // the boundary.
    const lastDay = Math.max(
      1,
      Math.ceil((inflows[inflows.length - 1].ts - now) / dayMs),
    );
    const series: { d: number; value: number }[] = [];
    let pointer = 0;
    let running = lastTvl;
    for (let day = 1; day <= lastDay; day++) {
      const tCutoff = now + day * dayMs;
      while (pointer < inflows.length && inflows[pointer].ts <= tCutoff) {
        running += inflows[pointer].amount;
        pointer++;
      }
      series.push({ d: day, value: running });
    }
    return series;
  }, [tvlSeries, funded]);

  // Variant A · time anchored: derive the time-axis labels and footer stats
  // from the combined day range of realized + projected series. `todayPct`
  // is where d=0 lands as a percentage of the chart's width.
  const anchors = useMemo(() => {
    const ds = [
      ...tvlSeries.map((s) => s.d),
      ...projectionSeries.map((s) => s.d),
    ];
    if (ds.length === 0) return null;
    const dMin = Math.min(...ds);
    const dMax = Math.max(...ds);
    const range = dMax - dMin || 1;
    const todayPct = ((0 - dMin) / range) * 100;
    return {
      dMin,
      dMax,
      range,
      todayPct,
      historyDays: -dMin,
      projectedDays: dMax,
    };
  }, [tvlSeries, projectionSeries]);

  const realizedNow =
    tvlSeries.length > 0 ? tvlSeries[tvlSeries.length - 1].value : 0;
  const projectedEndValue =
    projectionSeries.length > 0
      ? projectionSeries[projectionSeries.length - 1].value
      : 0;
  const projectedDelta =
    projectionSeries.length > 0 ? projectedEndValue - realizedNow : 0;
  const growthPct = realizedNow > 0 ? projectedDelta / realizedNow : 0;

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
          alignItems: "stretch",
        }}
      >
        <Card
          style={{
            padding: 28,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 508,
          }}
        >
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
              {delta24h !== null && delta24h !== 0 && (
                <div
                  className="mono"
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    color: delta24h > 0 ? "var(--green)" : "var(--fg-2)",
                  }}
                >
                  {delta24h > 0 ? "+" : ""}
                  {fmtBRZ(delta24h)} {t("inv_tvl_delta_suffix") as string}
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

          {tvlSeries.length >= 1 ? (
            <>
              <TVLChart
                series={tvlSeries}
                projection={projectionSeries}
                mult={1}
              />
              {anchors && (
                <div
                  className="mono"
                  style={{
                    position: "relative",
                    marginTop: 8,
                    height: 14,
                    fontSize: 10,
                    color: "var(--fg-3)",
                  }}
                >
                  <span style={{ position: "absolute", left: 0 }}>
                    {anchors.historyDays > 0
                      ? `−${anchors.historyDays}d`
                      : (t("inv_chart_anchor_start") as string)}
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      left: `${anchors.todayPct}%`,
                      transform:
                        anchors.todayPct > 90
                          ? "translateX(-100%)"
                          : anchors.todayPct < 10
                            ? "translateX(0)"
                            : "translateX(-50%)",
                      color: "var(--teal)",
                    }}
                  >
                    {t("inv_chart_today") as string}
                  </span>
                  {anchors.projectedDays > 0 && (
                    <span style={{ position: "absolute", right: 0 }}>
                      +{anchors.projectedDays}d
                    </span>
                  )}
                </div>
              )}
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 16,
                  borderTop: "1px solid var(--line-soft)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <FooterStatColored
                  label={t("inv_chart_stat_tvl_now") as string}
                  value={fmtBRZ(realizedNow)}
                  tone="teal"
                />
                <FooterStatColored
                  label={
                    anchors && anchors.projectedDays > 0
                      ? (
                          t("inv_chart_stat_projected_in") as unknown as (
                            d: number,
                          ) => string
                        )(anchors.projectedDays)
                      : (t("inv_chart_stat_projected") as string)
                  }
                  value={
                    projectionSeries.length > 0
                      ? fmtBRZ(projectedEndValue)
                      : "—"
                  }
                  tone="gold"
                  delta={
                    projectionSeries.length > 0 && projectedDelta > 0
                      ? `+${fmtPct(growthPct)}`
                      : null
                  }
                />
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                minHeight: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--fg-3)",
                fontSize: 13,
              }}
            >
              {t("inv_chart_empty") as string}
            </div>
          )}
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
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--line-soft)",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--fg-2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {t("inv_recent_events") as string}
              </div>
            </div>
            {/* Vault dashboard shows the GLOBAL feed; "see all →" switches
                to the positions tab where the same feed continues with full
                history. We use a callback (not a Link) because we're already
                on /invest — a Link would update the URL but not re-trigger
                the parent's tab-from-URL effect. */}
            <RecentEvents
              limit={3}
              compact
              showFullLink
              onSeeAll={() => setTab("positions")}
            />
          </Card>
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
        <div
          className="data-table-scroll"
          style={
            {
              "--mobile-grid-cols": "150px 1.4fr 1fr 100px 80px 100px",
            } as CSSProperties
          }
        >
          <div
            className="mono"
            style={{
              display: "grid",
              gridTemplateColumns: "150px 1.4fr 1fr 100px 80px 100px",
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
                  gridTemplateColumns: "150px 1.4fr 1fr 100px 80px 100px",
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
    if (!vaultData) return 1.0;
    const totalShares = Number(vaultData.totalShares);
    const totalAssets = Number(vaultData.totalAssets);
    if (totalShares === 0) return 1.0;
    return totalAssets / totalShares;
  }, [vaultData]);

  // APR shown to the investor — comes from the same weighted-rate computation
  // as the dashboard. Zero when no contracts are funded yet.
  const aprExpected = (vaultData?.aprBps ?? 0) / 10_000;

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
          <Row2
            l={t("dep_apr_exp") as string}
            r={aprExpected > 0 ? fmtPct(aprExpected) : "—"}
          />
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
  const [events, setEvents] = useState<VaultEvent[]>([]);

  // Derive numbers from real on-chain position; 0 when not yet deposited.
  const deposited = positionData
    ? Number(positionData.totalDeposited) / 1_000_000
    : 0;
  const value = positionData
    ? Number(positionData.estimatedValueBrz) / 1_000_000
    : 0;
  const sharesNum = positionData ? Number(positionData.shares) / 1_000_000 : 0;
  const yieldPct = deposited > 0 ? (value - deposited) / deposited : 0;

  // Show the same global vault feed the dashboard shows. As an investor your
  // capital is pooled — fund/repay events on contracts move share value too,
  // not just your own deposits/withdraws. So the position-tab history is a
  // continuation of the dashboard's "recent operations" card with the full
  // list, instead of a per-user filter that would hide vault activity that
  // affects you.
  useEffect(() => {
    void (async () => {
      const list = await listVaultEvents({ limit: 200 });
      setEvents(list);
    })();
  }, []);

  // Display all events; the user's personal txs are visually mixed with
  // vault-wide activity, ordered chronologically.
  const myEvents = events;

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
          sub={value > deposited ? `+${fmtBRZ(value - deposited)}` : "—"}
          tone="gold"
          mono
        />
        <KPI
          label={t("pos_kpi_yield") as string}
          value={yieldPct > 0 ? `+${fmtPct(yieldPct)}` : "—"}
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
            {t("inv_history_h") as string}
          </h3>
        </div>
        {myEvents.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              fontSize: 13,
              color: "var(--fg-3)",
            }}
          >
            {t("inv_history_empty") as string}
          </div>
        ) : (
          <div
            className="data-table-scroll"
            style={
              {
                "--mobile-grid-cols": "150px 1.2fr 110px 80px",
              } as CSSProperties
            }
          >
            <div
              className="mono"
              style={{
                display: "grid",
                gridTemplateColumns: "150px 1.2fr 110px 80px",
                padding: "10px 20px",
                fontSize: 11,
                color: "var(--fg-2)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              <span>{t("inv_history_th_when") as string}</span>
              <span>{t("inv_history_th_kind") as string}</span>
              <span style={{ textAlign: "right" }}>
                {t("inv_history_th_amount") as string}
              </span>
              <span style={{ textAlign: "right" }}>
                {t("inv_history_th_tx") as string}
              </span>
            </div>
            {myEvents.map((e) => (
              <div
                key={e.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "150px 1.2fr 110px 80px",
                  padding: "12px 20px",
                  fontSize: 13,
                  borderTop: "1px solid var(--line-soft)",
                  alignItems: "center",
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 12, color: "var(--fg-2)" }}
                >
                  {new Date(e.createdAt).toLocaleString("pt-BR")}
                </span>
                <span style={{ color: "var(--fg-1)" }}>
                  {t(`inv_history_kind_${e.kind}`) as string}
                </span>
                <span
                  className="mono"
                  style={{
                    textAlign: "right",
                    color:
                      e.kind === "deposit" || e.kind === "repay"
                        ? "var(--teal)"
                        : e.kind === "fund"
                          ? "var(--gold)"
                          : "var(--fg-1)",
                  }}
                >
                  {e.kind === "deposit" || e.kind === "repay" ? "+" : "-"}
                  {fmtBRZ(e.amountBrz)}
                </span>
                <span
                  style={{
                    textAlign: "right",
                  }}
                >
                  {e.txSignature ? (
                    <a
                      href={`https://explorer.solana.com/tx/${e.txSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: "var(--fg-2)",
                        display: "inline-flex",
                        gap: 4,
                        alignItems: "center",
                      }}
                    >
                      <I.link size={10} />
                      {e.txSignature.slice(0, 4)}…
                    </a>
                  ) : (
                    <span style={{ color: "var(--fg-3)", fontSize: 11 }}>—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function FooterStatColored({
  label,
  value,
  tone,
  delta,
}: {
  label: string;
  value: string;
  tone: "teal" | "gold";
  delta?: string | null;
}) {
  const color = tone === "teal" ? "var(--teal)" : "var(--gold)";
  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 10,
          color: "var(--fg-3)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: 999,
            background: color,
          }}
        />
        {label}
      </div>
      <div
        className="mono"
        style={{
          marginTop: 4,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 18, color, fontWeight: 500 }}>{value}</span>
        {delta && (
          <span style={{ fontSize: 12, color: "var(--green)" }}>{delta}</span>
        )}
      </div>
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
