"use client";

// ContractSteps — visual progress of a Brix receivable contract.
//
// Shows 4 steps as a horizontal pill chain, with optional expand for tx links:
//   1. registrado on-chain  (registerSig present)
//   2. BRZ liberado         (fundSig present)
//   3. repagamento X/N      (installmentsPaid > 0 → in progress; X >= total → done)
//   4. concluído            (status === "repaid")
//
// Used in /agency clients tab (after a contract exists for that client) and
// in /landlord contract cards. Reusable across personas.

import { Fragment, useState } from "react";
import type { AgencyContract } from "../../lib/agency-clients";
import { I } from "../icons";
import { useT } from "../../lib/i18n";

type StepState = "done" | "active" | "pending";

type Step = {
  id: string;
  label: string;
  state: StepState;
  txHash?: string;
};

function computeSteps(c: AgencyContract): Step[] {
  const registered =
    !!c.registerSig || c.status !== "pending";
  const funded =
    !!c.fundSig || c.status === "funded" || c.status === "repaid";
  const allPaid = c.installmentsPaid >= c.installmentsTotal;
  const repaid = c.status === "repaid";

  return [
    {
      id: "registered",
      label: "registrado on-chain",
      state: registered ? "done" : "active",
      txHash: c.registerSig,
    },
    {
      id: "funded",
      label: "BRZ liberado",
      state: funded ? "done" : registered ? "active" : "pending",
      txHash: c.fundSig,
    },
    {
      id: "repaying",
      label: `repagamento ${c.installmentsPaid}/${c.installmentsTotal}`,
      state: allPaid ? "done" : funded ? "active" : "pending",
    },
    {
      id: "repaid",
      label: "concluído",
      state: repaid ? "done" : "pending",
    },
  ];
}

function Circle({ state }: { state: StepState }) {
  const size = 22;
  const isDone = state === "done";
  const isActive = state === "active";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        flexShrink: 0,
        background: isDone
          ? "var(--gold)"
          : isActive
            ? "var(--gold-soft)"
            : "var(--bg-2)",
        border: isDone
          ? "1px solid var(--gold)"
          : isActive
            ? "1px solid var(--gold)"
            : "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isDone ? "oklch(0.18 0.02 75)" : "var(--gold)",
      }}
    >
      {isDone ? (
        <I.check size={12} />
      ) : isActive ? (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: "var(--gold)",
            display: "block",
          }}
        />
      ) : null}
    </div>
  );
}

function Connector({ done }: { done: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        height: 2,
        margin: "0 4px",
        background: done ? "var(--gold)" : "var(--line)",
      }}
    />
  );
}

export function ContractSteps({
  contract,
  compact = false,
}: {
  contract: AgencyContract;
  compact?: boolean;
}) {
  const { t: _t } = useT();
  const [expanded, setExpanded] = useState(false);
  const steps = computeSteps(contract);

  const txLinks = steps
    .filter((s) => s.txHash)
    .map((s) => ({ label: s.label, hash: s.txHash as string }));

  return (
    <div style={{ width: "100%" }}>
      {/* Step circles + connectors */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          padding: "4px 2px",
        }}
      >
        {steps.map((step, i) => (
          <Fragment key={step.id}>
            <Circle state={step.state} />
            {i < steps.length - 1 && (
              <Connector done={steps[i + 1].state !== "pending"} />
            )}
          </Fragment>
        ))}
      </div>

      {/* Labels under each circle */}
      {!compact && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
            gap: 4,
            marginTop: 8,
          }}
        >
          {steps.map((step) => (
            <div
              key={step.id}
              className="mono"
              style={{
                fontSize: 10.5,
                color:
                  step.state === "pending" ? "var(--fg-3)" : "var(--fg-1)",
                fontWeight: step.state === "active" ? 600 : 400,
                textAlign: "center",
                lineHeight: 1.3,
                wordBreak: "break-word",
              }}
            >
              {step.label}
            </div>
          ))}
        </div>
      )}

      {/* Expand toggle (only if there are tx hashes to show) */}
      {txLinks.length > 0 && (
        <div style={{ marginTop: compact ? 8 : 12 }}>
          <button
            onClick={() => setExpanded((v) => !v)}
            type="button"
            style={{
              fontSize: 11,
              color: "var(--fg-2)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: 0,
              background: "transparent",
            }}
          >
            <I.arrow
              size={10}
              style={{
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform .15s",
              }}
            />
            {expanded ? "ocultar txs" : `ver txs (${txLinks.length})`}
          </button>
          {expanded && (
            <div
              style={{
                marginTop: 8,
                padding: 10,
                background: "var(--bg-2)",
                border: "1px solid var(--line-soft)",
                borderRadius: "var(--radius)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 12,
              }}
            >
              {txLinks.map((tx) => (
                <a
                  key={tx.hash}
                  href={`https://explorer.solana.com/tx/${tx.hash}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono"
                  style={{
                    color: "var(--fg-1)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textDecoration: "none",
                  }}
                >
                  <I.link size={10} />
                  <span style={{ color: "var(--fg-2)" }}>{tx.label}:</span>
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tx.hash.slice(0, 8)}…{tx.hash.slice(-8)}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
