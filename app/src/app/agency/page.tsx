"use client";

// /agency — Selectimob operator portal.
// Tabs: portfolio (KPIs + receivables table) / register (3-step wizard) / repay.
// Owns the register_receivable + fund_landlord + repay flows via use-agency.
// Ported from Brix-handoff/brix/project/agency.jsx.

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
  fmtBRZShort,
  fmtPct,
  contractIdBytes,
  type ProtoReceivable,
  type ProtoStatus,
} from "../../lib/mock-data";
import { useAgency } from "../../hooks/use-agency";

type TabId = "portfolio" | "register" | "repay";

export default function AgencyPage() {
  const { t } = useT();
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [tab, setTab] = useState<TabId>("portfolio");

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.push("/login");
      return;
    }
    if (getPersona() !== "agency") router.push("/login");
  }, [ready, authenticated, router]);

  const tabs: Tab[] = [
    { id: "portfolio", label: t("ag_tab_portfolio") as string },
    { id: "register", label: t("ag_tab_register") as string },
    { id: "repay", label: t("ag_tab_repay") as string },
  ];

  return (
    <AppShell
      persona="agency"
      tabs={tabs}
      activeTab={tab}
      setActiveTab={(id) => setTab(id as TabId)}
    >
      {tab === "portfolio" && <Portfolio />}
      {tab === "register" && <RegisterReceivable setTab={setTab} />}
      {tab === "repay" && <RegisterRepayment />}
    </AppShell>
  );
}

// ─── Portfolio ──────────────────────────────────────────────────────────────
function Portfolio() {
  const { t } = useT();
  const [filter, setFilter] = useState<"all" | ProtoStatus>("all");
  const [q, setQ] = useState("");

  const filtered = RECEIVABLES.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (
      q &&
      !`${r.id} ${r.landlord} ${r.address}`
        .toLowerCase()
        .includes(q.toLowerCase())
    )
      return false;
    return true;
  });

  const totalFunded = RECEIVABLES.filter(
    (r) => r.status === "funded" || r.status === "repaid",
  ).reduce((s, r) => s + r.amount, 0);
  const active = RECEIVABLES.filter((r) => r.status === "funded").length;
  const defaultCount = RECEIVABLES.filter((r) => r.status === "defaulted")
    .length;

  const kpi3Sub = (t("ag_kpi3_s") as unknown as (n: number) => string)(active);

  return (
    <div className="fade-in" style={{ maxWidth: 1280, margin: "0 auto" }}>
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
          {t("ag_kicker") as string}
        </div>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            margin: "8px 0 0",
          }}
        >
          {t("ag_h1") as string}
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <KPI
          label={t("ag_kpi1_l") as string}
          value={String(RECEIVABLES.length)}
          sub={t("ag_kpi1_s") as string}
        />
        <KPI
          label={t("ag_kpi2_l") as string}
          value={String(RECEIVABLES.length)}
          sub={t("ag_kpi2_s") as string}
          mono
        />
        <KPI
          label={t("ag_kpi3_l") as string}
          value={fmtBRZShort(totalFunded)}
          sub={kpi3Sub}
          tone="gold"
        />
        <KPI
          label={t("ag_kpi4_l") as string}
          value={`${defaultCount} / ${RECEIVABLES.length}`}
          sub={t("ag_kpi4_s") as string}
          tone="green"
          mono
        />
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: 16,
            display: "flex",
            gap: 12,
            alignItems: "center",
            borderBottom: "1px solid var(--line-soft)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: 11,
                color: "var(--fg-3)",
              }}
            >
              <I.search size={16} />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("ag_search_ph") as string}
              className="field"
              style={{
                paddingLeft: 40,
                fontSize: 14,
                padding: "10px 14px 10px 40px",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: 4,
              background: "var(--bg-2)",
              borderRadius: 8,
            }}
          >
            {(
              [
                "all",
                "pending",
                "registered",
                "funded",
                "repaid",
                "defaulted",
              ] as const
            ).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="mono"
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  borderRadius: 6,
                  background: filter === s ? "var(--bg-0)" : "transparent",
                  color: filter === s ? "var(--fg-0)" : "var(--fg-2)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div
            className="mono"
            style={{
              display: "grid",
              gridTemplateColumns: "110px 1.5fr 1fr 100px 80px 100px 100px",
              padding: "12px 20px",
              fontSize: 11,
              color: "var(--fg-2)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: "1px solid var(--line-soft)",
            }}
          >
            <span>{t("ag_th_id") as string}</span>
            <span>{t("ag_th_owner") as string}</span>
            <span>{t("ag_th_property") as string}</span>
            <span>{t("ag_th_value") as string}</span>
            <span>{t("ag_th_rate") as string}</span>
            <span>{t("ag_th_inst") as string}</span>
            <span>{t("ag_th_status") as string}</span>
          </div>
          {filtered.map((r) => (
            <div
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1.5fr 1fr 100px 80px 100px 100px",
                padding: "14px 20px",
                fontSize: 14,
                borderBottom: "1px solid var(--line-soft)",
                alignItems: "center",
              }}
            >
              <span
                className="mono"
                style={{ fontSize: 12, color: "var(--fg-2)" }}
              >
                {r.id}
              </span>
              <span>{r.landlord}</span>
              <span
                style={{
                  color: "var(--fg-1)",
                  fontSize: 13,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.address}
              </span>
              <span className="mono">{fmtBRZ(r.amount)}</span>
              <span className="mono" style={{ color: "var(--gold)" }}>
                {fmtPct(r.rate)}
              </span>
              <span className="mono" style={{ color: "var(--fg-1)" }}>
                {r.paid}/{r.total}
              </span>
              <span>
                <Pill status={r.status}>{r.status}</Pill>
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Register receivable (3-step wizard) ────────────────────────────────────
function RegisterReceivable({ setTab }: { setTab: (id: TabId) => void }) {
  const { t } = useT();
  const { anteciparReceivable, isLoading } = useAgency();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState({
    landlord: "",
    address: "",
    rent: 1800,
    months: 6,
    fee: true,
    insurer: "Porto Seguro",
  });
  const apr = 0.18 + Math.max(0, data.months - 3) * 0.004;

  const subFn = t("reg_sub") as unknown as (a: number, b: number) => string;
  const doneFn = t("reg_done_p") as unknown as (apr: string) => string;

  const onConfirm = async () => {
    // Synthesize a contract id from the form fields so demo runs are unique.
    const seed = `${data.landlord}-${data.address}-${Date.now()}`;
    const contractId = contractIdBytes(seed);
    const principalBrz = data.rent * data.months;
    const repaymentBrz = principalBrz * (1 + apr * (data.months / 12));
    const sig = await anteciparReceivable({
      contractId,
      principalBrz,
      repaymentBrz,
      rateBps: Math.round(apr * 10_000),
      durationDays: data.months * 30,
    });
    if (sig) setStep(3);
  };

  if (step === 3) {
    return (
      <div
        className="fade-in"
        style={{ maxWidth: 640, margin: "40px auto", textAlign: "center" }}
      >
        <Card style={{ padding: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              margin: "0 auto 20px",
              background: "oklch(0.80 0.14 150 / 0.15)",
              color: "var(--green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <I.check size={28} />
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: "0 0 8px",
            }}
          >
            {t("reg_done_h") as string}
          </h2>
          <p style={{ color: "var(--fg-1)", margin: "0 0 24px" }}>
            {doneFn(fmtPct(apr))}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={() => {
                setStep(1);
                setTab("portfolio");
              }}
              className="btn btn-secondary"
            >
              {t("reg_done_view") as string}
            </button>
            <button
              onClick={() => {
                setStep(1);
                setData({
                  landlord: "",
                  address: "",
                  rent: 1800,
                  months: 6,
                  fee: true,
                  insurer: "Porto Seguro",
                });
              }}
              className="btn btn-primary"
            >
              {t("reg_done_again") as string}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: "0 0 8px",
        }}
      >
        {t("reg_h1") as string}
      </h1>
      <p style={{ color: "var(--fg-2)", fontSize: 14, margin: "0 0 28px" }}>
        {subFn(step, 2)}
      </p>

      {step === 1 && (
        <Card>
          <div style={{ marginBottom: 20 }}>
            <label className="label">{t("reg_landlord_l") as string}</label>
            <input
              value={data.landlord}
              onChange={(e) => setData({ ...data, landlord: e.target.value })}
              placeholder={t("reg_landlord_ph") as string}
              className="field"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="label">{t("reg_address_l") as string}</label>
            <input
              value={data.address}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              placeholder={t("reg_address_ph") as string}
              className="field"
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div>
              <label className="label">{t("reg_rent_l") as string}</label>
              <input
                type="number"
                value={data.rent}
                onChange={(e) => setData({ ...data, rent: +e.target.value })}
                className="field tnum mono"
              />
            </div>
            <div>
              <label className="label">{t("reg_months_l") as string}</label>
              <input
                type="number"
                min={3}
                max={12}
                value={data.months}
                onChange={(e) =>
                  setData({ ...data, months: +e.target.value })
                }
                className="field tnum mono"
              />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="label">{t("reg_insurer_l") as string}</label>
            <select
              value={data.insurer}
              onChange={(e) => setData({ ...data, insurer: e.target.value })}
              className="field"
            >
              <option>Porto Seguro</option>
              <option>Too Seguros</option>
              <option>Mapfre</option>
              <option>{t("reg_insurer_none") as string}</option>
            </select>
          </div>
          <button
            onClick={() => setStep(2)}
            className="btn btn-primary btn-lg"
            style={{ width: "100%" }}
            disabled={!data.landlord || !data.address}
          >
            {t("reg_review_cta") as string} <I.arrow size={16} />
          </button>
        </Card>
      )}

      {step === 2 && (
        <Card style={{ borderColor: "var(--gold)" }}>
          <div
            style={{
              padding: 12,
              marginBottom: 20,
              background: "var(--gold-soft)",
              borderRadius: "var(--radius)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "var(--gold)",
            }}
          >
            <I.lock size={14} />
            <span>{t("reg_warn") as string}</span>
          </div>
          <div
            className="mono"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              fontSize: 14,
            }}
          >
            <Row2 l={t("reg_r_landlord") as string} r={data.landlord} />
            <Row2 l={t("reg_r_property") as string} r={data.address} />
            <Row2
              l={t("reg_r_total") as string}
              r={fmtBRZ(data.rent * data.months)}
            />
            <Row2
              l={t("reg_r_inst") as string}
              r={`${data.months} × ${fmtBRZ(data.rent)}`}
            />
            <Row2 l={t("reg_r_apr") as string} r={fmtPct(apr)} accent />
            <Row2 l={t("reg_r_insurance") as string} r={data.insurer} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
            <button
              onClick={() => setStep(1)}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              {t("reg_back") as string}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              <I.lock size={14} />{" "}
              {isLoading ? "…" : (t("reg_confirm") as string)}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Register repayment ─────────────────────────────────────────────────────
function RegisterRepayment() {
  const { t } = useT();
  const { repay, isLoading } = useAgency();
  const funded = RECEIVABLES.filter((r) => r.status === "funded");
  const [picked, setPicked] = useState<ProtoReceivable>(funded[0]);
  const [done, setDone] = useState(false);

  const installmentBrz = picked.amount / picked.total;
  const restBrz =
    (picked.amount * (picked.total - picked.paid - 1)) / picked.total;

  const onConfirm = async () => {
    const contractId = contractIdBytes(picked.id);
    const sig = await repay({ contractId, amountBrz: installmentBrz });
    if (sig !== null) setDone(true);
    else setDone(true); // still flip in demo mode if vault not seeded
  };

  if (done) {
    return (
      <div className="fade-in" style={{ maxWidth: 540, margin: "40px auto" }}>
        <Card style={{ padding: 32, textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              margin: "0 auto 16px",
              background: "oklch(0.80 0.14 150 / 0.15)",
              color: "var(--green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <I.check size={24} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 8px" }}>
            {t("repay_done_h") as string}
          </h2>
          <p style={{ color: "var(--fg-1)", fontSize: 14, margin: 0 }}>
            {fmtBRZ(installmentBrz)} {t("repay_done_p_a") as string}
          </p>
          <button
            onClick={() => setDone(false)}
            className="btn btn-secondary"
            style={{ marginTop: 20 }}
          >
            {t("repay_done_again") as string}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: "0 0 8px",
        }}
      >
        {t("repay_h1") as string}
      </h1>
      <p style={{ color: "var(--fg-2)", fontSize: 14, margin: "0 0 28px" }}>
        {t("repay_sub") as string}
      </p>
      <Card>
        <label className="label">{t("repay_contract_l") as string}</label>
        <select
          value={picked.id}
          onChange={(e) => {
            const found = funded.find((f) => f.id === e.target.value);
            if (found) setPicked(found);
          }}
          className="field"
          style={{ marginBottom: 20 }}
        >
          {funded.map((f) => (
            <option key={f.id} value={f.id}>
              {f.id} · {f.landlord} · {f.paid}/{f.total} pago
            </option>
          ))}
        </select>

        <div
          className="mono"
          style={{
            padding: 18,
            background: "var(--bg-2)",
            borderRadius: "var(--radius)",
            fontSize: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <Row2
            l={t("repay_inst") as string}
            r={`${picked.paid + 1} / ${picked.total}`}
          />
          <Row2
            l={t("repay_value") as string}
            r={fmtBRZ(installmentBrz)}
            accent
          />
          <Row2 l={t("repay_rest") as string} r={fmtBRZ(restBrz)} />
        </div>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="btn btn-primary btn-lg"
          style={{ width: "100%" }}
        >
          <I.check size={16} /> {isLoading ? "…" : (t("repay_confirm") as string)}
        </button>
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
        gap: 16,
        paddingBottom: 12,
        borderBottom: "1px solid var(--line-soft)",
      }}
    >
      <span style={{ color: "var(--fg-2)", fontSize: 13 }}>{l}</span>
      <span
        style={{
          color: accent ? "var(--gold)" : "var(--fg-0)",
          fontWeight: accent ? 600 : 400,
          textAlign: "right",
        }}
      >
        {r}
      </span>
    </div>
  );
}
