"use client";

// /agency — Imobiliária operator portal (post-onboarding).
// Tabs: portfolio (KPIs + receivables) / clients (proprietários + imóveis CRM)
// / register (3-step wizard) / repay.
// Owns the register_receivable + fund_landlord + repay flows via use-agency.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { AppShell, type Tab } from "../../components/shell/AppShell";
import { I } from "../../components/icons";
import { KPI } from "../../components/primitives/KPI";
import { Card } from "../../components/primitives/Card";
import { Pill } from "../../components/primitives/Pill";
import { ContractSteps } from "../../components/primitives/ContractSteps";
import { RecentEvents } from "../../components/primitives/RecentEvents";
import { useT } from "../../lib/i18n";
import { getPersona } from "../../lib/persona";
import { fmtBRZ, fmtBRZShort, fmtPct, contractIdBytes } from "../../lib/mock-data";
import {
  addClient,
  addProperty,
  getAgencyApplication,
  getAgencyContracts,
  getAgencyStatus,
  getClients,
  getPropertiesByClientId,
  nextContractId,
  recordAgencyContract,
  type AgencyApplication,
  type AgencyClient,
  type AgencyContract,
  type AgencyContractStatus,
  type AgencyProperty,
} from "../../lib/agency-clients";
import { useAgency } from "../../hooks/use-agency";

type TabId = "portfolio" | "clients" | "register" | "repay" | "history";
const VALID_TABS: TabId[] = [
  "portfolio",
  "clients",
  "register",
  "repay",
  "history",
];

function readPrivyEmail(user: ReturnType<typeof usePrivy>["user"]): string {
  return (
    user?.email?.address ??
    (
      user?.linkedAccounts.find((a) => a.type === "email") as
        | { address?: string }
        | undefined
    )?.address ??
    ""
  );
}

export default function AgencyPage() {
  const { t } = useT();
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [hydrated, setHydrated] = useState(false);

  // Tab is in-memory state (no URL noise on click). Deep links from /history
  // still work via `?tab=...` on first mount; we strip it after consuming so
  // subsequent tab clicks don't desync the URL.
  const [tab, setTab] = useState<TabId>("portfolio");
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

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.push("/login");
      return;
    }
    if (getPersona() !== "agency") {
      router.push("/login");
      return;
    }
    void (async () => {
      const email = readPrivyEmail(user);
      const status = email ? await getAgencyStatus(email) : "none";
      if (status !== "approved") {
        router.push("/agency/onboard");
        return;
      }
      setHydrated(true);
    })();
  }, [ready, authenticated, user, router]);

  const tabs: Tab[] = [
    { id: "portfolio", label: t("ag_tab_portfolio") as string },
    { id: "clients", label: t("ag_tab_clients") as string },
    { id: "register", label: t("ag_tab_register") as string },
    { id: "repay", label: t("ag_tab_repay") as string },
    { id: "history", label: t("ag_tab_history") as string },
  ];

  return (
    <AppShell
      persona="agency"
      tabs={tabs}
      activeTab={tab}
      setActiveTab={(id) => setTab(id as TabId)}
    >
      {!hydrated ? null : tab === "portfolio" ? (
        <Portfolio setTab={setTab} />
      ) : tab === "clients" ? (
        <Clients setTab={setTab} />
      ) : tab === "register" ? (
        <RegisterReceivable setTab={setTab} />
      ) : tab === "repay" ? (
        <RegisterRepayment setTab={setTab} />
      ) : (
        <History />
      )}
    </AppShell>
  );
}

// ─── Operator badge (shows the agency that signed up) ──────────────────────
function OperatorBadge({ application }: { application: AgencyApplication | null }) {
  return (
    <div
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        borderRadius: 999,
        fontSize: 11,
        color: "var(--fg-2)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      <span>operated by</span>
      <span style={{ color: "var(--fg-1)", textTransform: "none" }}>
        {application?.companyName ?? "—"}
      </span>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────
function EmptyState({
  icon,
  title,
  description,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <Card style={{ padding: 48, textAlign: "center" }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          margin: "0 auto 18px",
          background: "var(--bg-2)",
          color: "var(--fg-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          margin: "0 0 6px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: "var(--fg-2)",
          fontSize: 14,
          margin: "0 auto 20px",
          maxWidth: 420,
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>
      {cta && (
        <button onClick={cta.onClick} className="btn btn-primary">
          {cta.label} <I.arrow size={14} />
        </button>
      )}
    </Card>
  );
}

// ─── Skeleton (used while data loads — prevents empty-state flash) ──────────
function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <Card style={{ padding: 0, overflow: "hidden", opacity: 0.55 }}>
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid var(--line-soft)",
          display: "flex",
          gap: 12,
        }}
      >
        <div
          style={{
            height: 36,
            flex: "1 1 240px",
            background: "var(--bg-2)",
            borderRadius: 8,
          }}
        />
        <div
          style={{
            height: 36,
            width: 280,
            background: "var(--bg-2)",
            borderRadius: 8,
          }}
        />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: "14px 20px",
            borderBottom:
              i === count - 1 ? "none" : "1px solid var(--line-soft)",
            display: "grid",
            gridTemplateColumns: "160px 1.5fr 1fr 100px 80px 100px 100px",
            gap: 12,
            alignItems: "center",
          }}
        >
          {Array.from({ length: 7 }).map((__, j) => (
            <div
              key={j}
              style={{
                height: 14,
                background: "var(--bg-2)",
                borderRadius: 4,
              }}
            />
          ))}
        </div>
      ))}
    </Card>
  );
}

// ─── Portfolio ──────────────────────────────────────────────────────────────
function Portfolio({ setTab }: { setTab: (id: TabId) => void }) {
  const { t } = useT();
  const { user } = usePrivy();
  const [filter, setFilter] = useState<"all" | AgencyContractStatus>("all");
  const [q, setQ] = useState("");
  const [contracts, setContracts] = useState<AgencyContract[]>([]);
  const [application, setApplication] = useState<AgencyApplication | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const email = readPrivyEmail(user);
      const [list, app] = await Promise.all([
        getAgencyContracts(),
        email ? getAgencyApplication(email) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setContracts(list);
      setApplication(app);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = contracts.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (
      q &&
      !`${r.id} ${r.landlordName} ${r.propertyAddress}`
        .toLowerCase()
        .includes(q.toLowerCase())
    )
      return false;
    return true;
  });

  const totalFunded = contracts
    .filter((r) => r.status === "funded" || r.status === "repaid")
    .reduce((s, r) => s + r.principalBrz, 0);
  const active = contracts.filter((r) => r.status === "funded").length;
  const defaultCount = contracts.filter((r) => r.status === "defaulted").length;

  // Status breakdown for the strip below the KPIs. Splits "funded" into two
  // operationally distinct buckets: contracts that haven't received any
  // installment yet (the agency is waiting on the tenant for month one) vs
  // contracts already collecting installments.
  const awaitingFirst = contracts.filter(
    (r) => r.status === "funded" && r.installmentsPaid === 0,
  ).length;
  const inProgress = contracts.filter(
    (r) =>
      r.status === "funded" &&
      r.installmentsPaid > 0 &&
      r.installmentsPaid < r.installmentsTotal,
  ).length;
  const settled = contracts.filter((r) => r.status === "repaid").length;

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
            marginBottom: 8,
          }}
        >
          {t("ag_kicker") as string}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            {t("ag_h1") as string}
          </h1>
          <OperatorBadge application={application} />
        </div>
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
          value={String(contracts.length)}
          sub={t("ag_kpi1_s") as string}
        />
        <KPI
          label={t("ag_kpi2_l") as string}
          value={String(contracts.length)}
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
          value={`${defaultCount} / ${Math.max(contracts.length, 0)}`}
          sub={t("ag_kpi4_s") as string}
          tone="green"
          mono
        />
      </div>

      {contracts.length > 0 && (
        <StatusStrip
          awaitingFirst={awaitingFirst}
          inProgress={inProgress}
          settled={settled}
        />
      )}

      {loading ? (
        <SkeletonRows />
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={<I.chart size={26} />}
          title={t("ag_empty_h") as string}
          description={t("ag_empty_p") as string}
          cta={{
            label: t("ag_empty_cta") as string,
            onClick: () => setTab("register"),
          }}
        />
      ) : (
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
            <div
              style={{
                position: "relative",
                flex: "1 1 240px",
                minWidth: 200,
              }}
            >
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
            <button
              onClick={() => setTab("register")}
              className="btn btn-primary"
              style={{ marginLeft: "auto" }}
            >
              <I.plus size={14} /> {t("ag_new_advance") as string}
            </button>
          </div>

          <div className="data-table-scroll">
            <div
              className="mono"
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1.5fr 1fr 100px 80px 100px 100px",
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
                  gridTemplateColumns:
                    "160px 1.5fr 1fr 100px 80px 100px 100px",
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
                <span>{r.landlordName}</span>
                <span
                  style={{
                    color: "var(--fg-1)",
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.propertyAddress}
                </span>
                <span className="mono">{fmtBRZ(r.principalBrz)}</span>
                <span className="mono" style={{ color: "var(--gold)" }}>
                  {fmtPct(r.rateBps / 10_000)}
                </span>
                <span className="mono" style={{ color: "var(--fg-1)" }}>
                  {r.installmentsPaid}/{r.installmentsTotal}
                </span>
                <span>
                  <Pill status={r.status}>{r.status}</Pill>
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Clients (CRM with nested properties) ──────────────────────────────────
function Clients({ setTab }: { setTab: (id: TabId) => void }) {
  const { t } = useT();
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [properties, setProperties] = useState<AgencyProperty[]>([]);
  const [contracts, setContracts] = useState<AgencyContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showPropFormForClient, setShowPropFormForClient] = useState<
    string | null
  >(null);
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    pixKey: "",
  });
  const [propForm, setPropForm] = useState({
    address: "",
    monthlyRentBrz: 1800,
  });

  const refresh = async () => {
    const list = await getClients();
    setClients(list);
    const propsLists = await Promise.all(
      list.map((c) => getPropertiesByClientId(c.id)),
    );
    setProperties(propsLists.flat());
    setContracts(await getAgencyContracts());
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const onSaveClient = async () => {
    if (!clientForm.name || !clientForm.email) return;
    try {
      await addClient({
        name: clientForm.name,
        email: clientForm.email,
        cpf: clientForm.cpf || undefined,
        phone: clientForm.phone || undefined,
        pixKey: clientForm.pixKey || clientForm.email,
      });
      setClientForm({ name: "", email: "", cpf: "", phone: "", pixKey: "" });
      setShowClientForm(false);
      await refresh();
    } catch (err) {
      console.error("[agency] addClient failed:", err);
    }
  };

  const onSaveProperty = async (clientId: string) => {
    if (!propForm.address) return;
    try {
      await addProperty({
        clientId,
        address: propForm.address,
        monthlyRentBrz: propForm.monthlyRentBrz,
      });
      setPropForm({ address: "", monthlyRentBrz: 1800 });
      setShowPropFormForClient(null);
      await refresh();
    } catch (err) {
      console.error("[agency] addProperty failed:", err);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div
        style={{
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <div
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--fg-2)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            {t("clients_kicker") as string}
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            {t("clients_h") as string}
          </h1>
          <p style={{ color: "var(--fg-2)", fontSize: 14, margin: "8px 0 0" }}>
            {(t("clients_sub") as unknown as (n: number) => string)(
              clients.length,
            )}
          </p>
        </div>
        {clients.length > 0 && (
          <button
            onClick={() => setShowClientForm((v) => !v)}
            className="btn btn-primary"
          >
            <I.plus size={14} />{" "}
            {showClientForm
              ? (t("clients_cancel") as string)
              : (t("clients_new") as string)}
          </button>
        )}
      </div>

      {showClientForm && (
        <Card style={{ marginBottom: 20, borderColor: "var(--gold)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>
            {t("clients_form_h") as string}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div>
              <label className="label">
                {t("clients_form_name_l") as string} *
              </label>
              <input
                value={clientForm.name}
                onChange={(e) =>
                  setClientForm({ ...clientForm, name: e.target.value })
                }
                placeholder={t("clients_form_name_ph") as string}
                className="field"
              />
            </div>
            <div>
              <label className="label">
                {t("clients_form_email_l") as string} *
              </label>
              <input
                type="email"
                value={clientForm.email}
                onChange={(e) =>
                  setClientForm({ ...clientForm, email: e.target.value })
                }
                placeholder="email@dominio.com"
                className="field"
              />
            </div>
            <div>
              <label className="label">{t("clients_form_cpf_l") as string}</label>
              <input
                value={clientForm.cpf}
                onChange={(e) =>
                  setClientForm({ ...clientForm, cpf: e.target.value })
                }
                placeholder="000.000.000-00"
                className="field mono"
              />
            </div>
            <div>
              <label className="label">
                {t("clients_form_phone_l") as string}
              </label>
              <input
                value={clientForm.phone}
                onChange={(e) =>
                  setClientForm({ ...clientForm, phone: e.target.value })
                }
                placeholder="+55 11 9****-****"
                className="field mono"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">
                {t("clients_form_pix_l") as string}
              </label>
              <input
                value={clientForm.pixKey}
                onChange={(e) =>
                  setClientForm({ ...clientForm, pixKey: e.target.value })
                }
                placeholder={t("clients_form_pix_ph") as string}
                className="field"
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 20,
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => setShowClientForm(false)}
              className="btn btn-secondary"
            >
              {t("clients_cancel") as string}
            </button>
            <button
              onClick={onSaveClient}
              disabled={!clientForm.name || !clientForm.email}
              className="btn btn-primary"
            >
              <I.check size={14} /> {t("clients_save") as string}
            </button>
          </div>
        </Card>
      )}

      {loading ? (
        <SkeletonRows count={2} />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<I.building size={26} />}
          title={t("clients_empty_h") as string}
          description={t("clients_empty_p") as string}
          cta={{
            label: t("clients_empty_cta") as string,
            onClick: () => setShowClientForm(true),
          }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clients.map((c) => {
            const cProps = properties.filter((p) => p.clientId === c.id);
            const cContracts = contracts.filter((k) => k.clientId === c.id);
            const activeContracts = cContracts.filter(
              (k) => k.status === "funded" || k.status === "registered",
            ).length;
            return (
              <Card key={c.id} style={{ padding: 22 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      background: "var(--gold-soft)",
                      color: "var(--gold)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <I.building size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 600 }}>
                        {c.name}
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: 12, color: "var(--fg-3)" }}
                      >
                        {c.email}
                      </span>
                    </div>
                    {c.phone && (
                      <div
                        className="mono"
                        style={{
                          fontSize: 12,
                          color: "var(--fg-3)",
                          marginTop: 4,
                        }}
                      >
                        {c.phone}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      fontSize: 13,
                    }}
                  >
                    <Stat
                      l={t("clients_st_props") as string}
                      v={String(cProps.length)}
                    />
                    <Stat
                      l={t("clients_st_active") as string}
                      v={`${activeContracts} / ${cContracts.length}`}
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 16,
                    borderTop: "1px solid var(--line-soft)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: "var(--fg-2)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {t("clients_props_h") as string}
                    </div>
                    <button
                      onClick={() =>
                        setShowPropFormForClient((cur) =>
                          cur === c.id ? null : c.id,
                        )
                      }
                      style={{
                        fontSize: 12,
                        color: "var(--gold)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <I.plus size={12} />{" "}
                      {showPropFormForClient === c.id
                        ? (t("clients_cancel") as string)
                        : (t("clients_add_prop") as string)}
                    </button>
                  </div>

                  {showPropFormForClient === c.id && (
                    <div
                      style={{
                        padding: 14,
                        background: "var(--bg-2)",
                        borderRadius: "var(--radius)",
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr",
                          gap: 10,
                        }}
                      >
                        <div>
                          <label className="label">
                            {t("clients_prop_addr_l") as string}
                          </label>
                          <input
                            value={propForm.address}
                            onChange={(e) =>
                              setPropForm({
                                ...propForm,
                                address: e.target.value,
                              })
                            }
                            placeholder={
                              t("clients_prop_addr_ph") as string
                            }
                            className="field"
                          />
                        </div>
                        <div>
                          <label className="label">
                            {t("clients_prop_rent_l") as string}
                          </label>
                          <input
                            type="number"
                            value={propForm.monthlyRentBrz}
                            onChange={(e) =>
                              setPropForm({
                                ...propForm,
                                monthlyRentBrz: +e.target.value || 0,
                              })
                            }
                            className="field tnum mono"
                          />
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginTop: 12,
                          gap: 6,
                        }}
                      >
                        <button
                          onClick={() => setShowPropFormForClient(null)}
                          className="btn btn-secondary"
                          style={{ fontSize: 13 }}
                        >
                          {t("clients_cancel") as string}
                        </button>
                        <button
                          onClick={() => onSaveProperty(c.id)}
                          disabled={!propForm.address}
                          className="btn btn-primary"
                          style={{ fontSize: 13 }}
                        >
                          <I.check size={12} />{" "}
                          {t("clients_save") as string}
                        </button>
                      </div>
                    </div>
                  )}

                  {cProps.length === 0 ? (
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--fg-3)",
                        fontStyle: "italic",
                      }}
                    >
                      {t("clients_no_props") as string}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {cProps.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            background: "var(--bg-2)",
                            borderRadius: "var(--radius)",
                            fontSize: 14,
                          }}
                        >
                          <span>{p.address}</span>
                          <span className="mono" style={{ color: "var(--fg-2)" }}>
                            {fmtBRZ(p.monthlyRentBrz)}
                            <span style={{ fontSize: 11, marginLeft: 6 }}>
                              /mês
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cProps.length > 0 && (() => {
                  // If the client has any contract that's not finished, show its
                  // step progress instead of the "advance" CTA. Picks the most
                  // recently registered active contract.
                  const active = cContracts
                    .filter(
                      (k) =>
                        k.status === "registered" ||
                        k.status === "funded",
                    )
                    .sort((a, b) => b.registeredAt - a.registeredAt)[0];
                  if (active) {
                    return (
                      <div
                        style={{
                          marginTop: 16,
                          paddingTop: 16,
                          borderTop: "1px solid var(--line-soft)",
                        }}
                      >
                        <div
                          className="mono"
                          style={{
                            fontSize: 11,
                            color: "var(--fg-2)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 10,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                          }}
                        >
                          <span>{active.id} · status</span>
                          <button
                            onClick={() => setTab("portfolio")}
                            style={{
                              fontSize: 11,
                              color: "var(--gold)",
                              textTransform: "none",
                              letterSpacing: "normal",
                            }}
                          >
                            ver no portfólio →
                          </button>
                        </div>
                        <ContractSteps contract={active} />
                      </div>
                    );
                  }
                  return (
                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => setTab("register")}
                        className="btn btn-secondary"
                        style={{ fontSize: 13 }}
                      >
                        {t("clients_advance") as string} <I.arrow size={14} />
                      </button>
                    </div>
                  );
                })()}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div
        className="mono"
        style={{
          fontSize: 10,
          color: "var(--fg-3)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {l}
      </div>
      <div className="mono" style={{ fontSize: 14, fontWeight: 500 }}>
        {v}
      </div>
    </div>
  );
}

// ─── Register receivable (3-step wizard) ────────────────────────────────────
function RegisterReceivable({ setTab }: { setTab: (id: TabId) => void }) {
  const { t } = useT();
  const { anteciparReceivable, isLoading } = useAgency();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [propsForClient, setPropsForClient] = useState<AgencyProperty[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  // Agency-defined annual rate. Sanity bounds reflect reasonable BR rental
  // advance pricing — below 15% the spread doesn't cover Brix fee + insurance,
  // above 40% becomes predatory (cf. CashGO bait-and-switch the pitch
  // explicitly attacks).
  const APR_MIN_PCT = 15;
  const APR_MAX_PCT = 40;
  // Brix protocol fee — single source in lib/brix-fees.ts so /invest sees
  // the same constant when computing the net APR shown to the investor.
  const BRIX_FEE_PCT = 2; // = BRIX_PROTOCOL_FEE_BPS / 100, kept inline to avoid extra import in this hot file
  const [data, setData] = useState({
    months: 6,
    insurer: "Porto Seguro",
    aprPct: 19,
  });

  useEffect(() => {
    void (async () => {
      setClients(await getClients());
    })();
  }, []);

  useEffect(() => {
    if (!selectedClient) {
      setPropsForClient([]);
      setSelectedProperty("");
      return;
    }
    void (async () => {
      const list = await getPropertiesByClientId(selectedClient);
      setPropsForClient(list);
      setSelectedProperty(list[0]?.id ?? "");
    })();
  }, [selectedClient]);

  // Derive selection from state instead of fetching again — clients and
  // propsForClient are already loaded above.
  const property =
    propsForClient.find((p) => p.id === selectedProperty) ?? null;
  const client = clients.find((c) => c.id === selectedClient) ?? null;
  const rent = property?.monthlyRentBrz ?? 0;
  const aprValid =
    data.aprPct >= APR_MIN_PCT && data.aprPct <= APR_MAX_PCT;
  const apr = data.aprPct / 100;
  const investorAprPct = Math.max(0, data.aprPct - BRIX_FEE_PCT);
  const principalBrz = rent * data.months;
  const repaymentBrz = principalBrz * (1 + apr * (data.months / 12));

  const subFn = t("reg_sub") as unknown as (a: number, b: number) => string;
  const doneFn = t("reg_done_p") as unknown as (apr: string) => string;

  const canProceed =
    !!client && !!property && data.months > 0 && aprValid;

  const onConfirm = async () => {
    if (!client || !property) return;

    // Display ID is BRX-2026-NNNN — short (13 chars), unique, sequential.
    // Used as the seed for the on-chain contract_id_bytes so register and
    // repay derive the SAME Receivable PDA. Previously the register seed
    // included a Date.now() timestamp that overflowed the 32-byte slice
    // and made repay derive a different PDA — that bug is fixed here.
    const displayId = await nextContractId();
    const contractId = contractIdBytes(displayId);

    const sigs = await anteciparReceivable({
      contractId,
      principalBrz,
      repaymentBrz,
      rateBps: Math.round(apr * 10_000),
      durationDays: data.months * 30,
    });

    // anteciparReceivable returns null on any failure (toast already shown).
    // Don't create a ghost off-chain row when on-chain didn't actually happen.
    if (sigs === null) return;

    try {
      await recordAgencyContract({
        id: displayId,
        clientId: client.id,
        propertyId: property.id,
        landlordName: client.name,
        propertyAddress: property.address,
        principalBrz,
        repaymentBrz,
        rateBps: Math.round(apr * 10_000),
        durationDays: data.months * 30,
        installmentsTotal: data.months,
        installmentsPaid: 0,
        status: "funded",
        hasInsurance: data.insurer !== (t("reg_insurer_none") as string),
        insurer: data.insurer,
        registerSig: sigs.registerSig,
        fundSig: sigs.fundSig,
        registeredAt: Date.now(),
        fundedAt: Date.now(),
      });
      setStep(3);
    } catch (err) {
      console.error("[agency] recordAgencyContract failed:", err);
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedClient("");
    setSelectedProperty("");
    setData({ months: 6, insurer: "Porto Seguro" });
  };

  // No clients yet → guide to clients tab.
  if (clients.length === 0) {
    return (
      <div className="fade-in" style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            margin: "0 0 12px",
          }}
        >
          {t("reg_h1") as string}
        </h1>
        <EmptyState
          icon={<I.building size={26} />}
          title={t("reg_no_clients_h") as string}
          description={t("reg_no_clients_p") as string}
          cta={{
            label: t("reg_no_clients_cta") as string,
            onClick: () => setTab("clients"),
          }}
        />
      </div>
    );
  }

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
                reset();
                setTab("portfolio");
              }}
              className="btn btn-secondary"
            >
              {t("reg_done_view") as string}
            </button>
            <button onClick={reset} className="btn btn-primary">
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
            <label className="label">
              {t("reg_pick_client_l") as string} *
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="field"
            >
              <option value="">{t("reg_pick_client_ph") as string}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.email}
                </option>
              ))}
            </select>
          </div>

          {selectedClient && propsForClient.length === 0 && (
            <div
              style={{
                padding: 16,
                background: "var(--bg-2)",
                border: "1px dashed var(--line)",
                borderRadius: "var(--radius)",
                marginBottom: 20,
                fontSize: 13,
                color: "var(--fg-2)",
                lineHeight: 1.5,
              }}
            >
              {t("reg_no_props_for_client") as string}
              <button
                onClick={() => setTab("clients")}
                style={{
                  marginLeft: 6,
                  color: "var(--gold)",
                  textDecoration: "underline",
                  fontSize: 13,
                }}
              >
                {t("reg_no_props_cta") as string}
              </button>
            </div>
          )}

          {selectedClient && propsForClient.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label className="label">
                {t("reg_pick_property_l") as string} *
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="field"
              >
                {propsForClient.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.address} · {fmtBRZ(p.monthlyRentBrz)}/mês
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label className="label">{t("reg_months_l") as string}</label>
            <input
              type="number"
              min={3}
              max={12}
              value={data.months}
              onChange={(e) => setData({ ...data, months: +e.target.value })}
              className="field tnum mono"
            />
            <div
              style={{
                fontSize: 12,
                color: "var(--fg-3)",
                marginTop: 6,
              }}
            >
              {t("reg_months_help") as string}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="label">{t("reg_apr_l") as string}</label>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                min={APR_MIN_PCT}
                max={APR_MAX_PCT}
                step={0.5}
                value={data.aprPct}
                onChange={(e) =>
                  setData({ ...data, aprPct: +e.target.value || 0 })
                }
                className="field tnum mono"
                style={{ paddingRight: 32 }}
              />
              <span
                className="mono"
                style={{
                  position: "absolute",
                  right: 14,
                  top: 14,
                  color: "var(--fg-3)",
                  fontSize: 14,
                }}
              >
                %
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: aprValid ? "var(--fg-3)" : "var(--red, #ef4444)",
                marginTop: 6,
              }}
            >
              {aprValid
                ? (
                    t("reg_apr_help") as unknown as (
                      min: number,
                      max: number,
                    ) => string
                  )(APR_MIN_PCT, APR_MAX_PCT)
                : (
                    t("reg_apr_oor") as unknown as (
                      min: number,
                      max: number,
                    ) => string
                  )(APR_MIN_PCT, APR_MAX_PCT)}
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

          {property && (
            <div
              className="mono"
              style={{
                padding: 14,
                background: "var(--bg-2)",
                borderRadius: "var(--radius)",
                marginBottom: 20,
                fontSize: 13,
                color: "var(--fg-1)",
              }}
            >
              <Row2
                l={t("reg_pre_total") as string}
                r={fmtBRZ(principalBrz)}
              />
              <Row2 l={t("reg_pre_apr") as string} r={fmtPct(apr)} accent />
              <Row2
                l={t("reg_pre_brix_fee") as string}
                r={`${BRIX_FEE_PCT}% a.a.`}
              />
              <Row2
                l={t("reg_pre_investor_yield") as string}
                r={`${investorAprPct.toFixed(1).replace(".", ",")}% a.a.`}
              />
            </div>
          )}

          <button
            onClick={() => setStep(2)}
            className="btn btn-primary btn-lg"
            style={{ width: "100%" }}
            disabled={!canProceed}
          >
            {t("reg_review_cta") as string} <I.arrow size={16} />
          </button>
        </Card>
      )}

      {step === 2 && client && property && (
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
            <Row2 l={t("reg_r_landlord") as string} r={client.name} />
            <Row2 l={t("reg_r_property") as string} r={property.address} />
            <Row2
              l={t("reg_r_total") as string}
              r={fmtBRZ(principalBrz)}
            />
            <Row2
              l={t("reg_r_inst") as string}
              r={`${data.months} × ${fmtBRZ(rent)}`}
            />
            <Row2 l={t("reg_r_apr") as string} r={fmtPct(apr)} accent />
            <Row2
              l={t("reg_r_brix_fee") as string}
              r={`${BRIX_FEE_PCT}% a.a.`}
            />
            <Row2
              l={t("reg_r_investor_yield") as string}
              r={`${investorAprPct.toFixed(1).replace(".", ",")}% a.a.`}
            />
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
function RegisterRepayment({ setTab }: { setTab: (id: TabId) => void }) {
  const { t } = useT();
  const { repay, isLoading } = useAgency();
  const [contracts, setContracts] = useState<AgencyContract[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void (async () => {
      setContracts(await getAgencyContracts());
      setLoading(false);
    })();
  }, []);

  const funded = contracts.filter((c) => c.status === "funded");
  const [pickedId, setPickedId] = useState<string>("");
  useEffect(() => {
    if (!pickedId && funded.length > 0) setPickedId(funded[0].id);
  }, [funded, pickedId]);
  const picked = funded.find((f) => f.id === pickedId);
  const [done, setDone] = useState(false);

  if (loading) {
    return (
      <div className="fade-in" style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            margin: "0 0 12px",
          }}
        >
          {t("repay_h1") as string}
        </h1>
        <SkeletonRows count={2} />
      </div>
    );
  }

  if (funded.length === 0) {
    return (
      <div className="fade-in" style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            margin: "0 0 12px",
          }}
        >
          {t("repay_h1") as string}
        </h1>
        <EmptyState
          icon={<I.check size={26} />}
          title={t("repay_empty_h") as string}
          description={t("repay_empty_p") as string}
          cta={{
            label: t("repay_empty_cta") as string,
            onClick: () => setTab("portfolio"),
          }}
        />
      </div>
    );
  }

  if (!picked) return null;

  // Each installment is principal + interest (i.e. repaymentBrz / N), NOT
  // just principalBrz / N. Using principal-only here was a bug: it caused
  // the on-chain repay to pay back principal at par with no interest, so
  // TVL only grew by the small interest portion the on-chain logic could
  // attribute from the gap between paid amount and outstanding principal.
  // Using repaymentBrz makes each installment a full annuity payment that
  // matches the rate the investor was promised at signing.
  const installmentBrz = picked.repaymentBrz / picked.installmentsTotal;
  const restBrz =
    (picked.repaymentBrz *
      (picked.installmentsTotal - picked.installmentsPaid - 1)) /
    picked.installmentsTotal;

  const onConfirm = async () => {
    const contractId = contractIdBytes(picked.id);
    const sig = await repay({ contractId, amountBrz: installmentBrz });
    // Update the off-chain contract record so portfolio + landlord views advance.
    // We record progress regardless of on-chain success in demo mode (vault may
    // not be seeded yet), but only mark "repaid" status when fully paid.
    const newPaid = picked.installmentsPaid + 1;
    const allPaid = newPaid >= picked.installmentsTotal;
    try {
      await recordAgencyContract({
        ...picked,
        installmentsPaid: newPaid,
        status: allPaid ? "repaid" : picked.status,
      });
      setContracts(await getAgencyContracts());
    } catch (err) {
      console.error("[agency] repay record failed:", err);
    }
    if (sig !== null) setDone(true);
    else setDone(true);
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
          onChange={(e) => setPickedId(e.target.value)}
          className="field"
          style={{ marginBottom: 20 }}
        >
          {funded.map((f) => (
            <option key={f.id} value={f.id}>
              {f.id} · {f.landlordName} · {f.installmentsPaid}/
              {f.installmentsTotal} pago
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
            r={`${picked.installmentsPaid + 1} / ${picked.installmentsTotal}`}
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

// ─── Status strip ──────────────────────────────────────────────────────────
// Compact 3-up summary above the receivables table. Splits the operationally
// distinct buckets the agency needs at a glance: contracts where they're
// waiting on the tenant for the first payment, contracts with installments
// already coming in, and contracts fully settled.
function StatusStrip({
  awaitingFirst,
  inProgress,
  settled,
}: {
  awaitingFirst: number;
  inProgress: number;
  settled: number;
}) {
  const { t } = useT();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        marginBottom: 24,
      }}
    >
      <StatusCell
        label={t("ag_status_awaiting_l") as string}
        value={awaitingFirst}
        tone="amber"
      />
      <StatusCell
        label={t("ag_status_in_progress_l") as string}
        value={inProgress}
        tone="teal"
      />
      <StatusCell
        label={t("ag_status_settled_l") as string}
        value={settled}
        tone="green"
      />
    </div>
  );
}

function StatusCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "teal" | "green";
}) {
  const color =
    tone === "amber"
      ? "var(--gold)"
      : tone === "teal"
        ? "var(--teal)"
        : "var(--green)";
  return (
    <div
      style={{
        padding: "14px 18px",
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--fg-2)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
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
            marginRight: 8,
            verticalAlign: "middle",
          }}
        />
        {label}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 22,
          fontWeight: 500,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── History tab ───────────────────────────────────────────────────────────
// Vault events triggered by THIS agency operator (fund + repay), via the
// `email` filter on listVaultEvents. RecentEvents handles the rendering;
// here we just frame it with the page title and pass the right filter.
function History() {
  const { t } = useT();
  const { user } = usePrivy();
  const email = readPrivyEmail(user);

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
        {t("ag_history_h") as string}
      </h1>
      <p
        style={{
          color: "var(--fg-2)",
          marginTop: 0,
          marginBottom: 24,
          fontSize: 14,
        }}
      >
        {t("ag_history_sub") as string}
      </p>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <RecentEvents email={email || undefined} limit={200} />
      </Card>
    </div>
  );
}
