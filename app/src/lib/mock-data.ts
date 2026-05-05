// Mock de recebíveis Selectimob — dados anonimizados pra demo.
// Em CP3, esses dados virão de `scripts/demo-data.json` e serão
// registrados on-chain via seed-demo.ts.
//
// Campos espelham os parâmetros do instruction `register_receivable`:
//   contract_id: [u8; 32]  — hash único do contrato off-chain
//   principal: u64          — BRZ que o landlord recebe (6 decimais)
//   repayment: u64          — BRZ que volta pro vault (principal + juros)
//   rate_bps: u16           — taxa anual em bps (ex: 2000 = 20%)
//   duration_days: u32      — prazo em dias

export type ReceivableStatus = "Registered" | "Funded" | "Repaid" | "Pending";

export interface MockReceivable {
  // Identificação
  id: string;             // slug legível (usado como base pro contract_id bytes)
  landlordName: string;   // nome anonimizado do proprietário
  propertyCity: string;
  // Financeiro (em BRZ, não em lamports — convertemos na hora de chamar o program)
  principalBrz: number;
  repaymentBrz: number;
  rateBps: number;
  durationDays: number;
  // Estado no demo
  status: ReceivableStatus;
  // Seguro fiança
  hasSeguroFianca: boolean;
  tenantName: string;     // anonimizado
}

export const MOCK_RECEIVABLES: MockReceivable[] = [
  {
    id: "SEL-2026-001",
    landlordName: "Carlos M.",
    propertyCity: "São Paulo, SP",
    principalBrz: 8_000,
    repaymentBrz: 9_600,   // 20% ao ano, 12 meses
    rateBps: 2000,
    durationDays: 365,
    status: "Funded",
    hasSeguroFianca: true,
    tenantName: "Inquilino A.",
  },
  {
    id: "SEL-2026-002",
    landlordName: "Maria R.",
    propertyCity: "Campinas, SP",
    principalBrz: 5_500,
    repaymentBrz: 6_050,   // 20% ao ano, 6 meses
    rateBps: 2000,
    durationDays: 180,
    status: "Registered",
    hasSeguroFianca: true,
    tenantName: "Inquilino B.",
  },
  {
    id: "SEL-2026-003",
    landlordName: "João P.",
    propertyCity: "São Paulo, SP",
    principalBrz: 12_000,
    repaymentBrz: 14_400,
    rateBps: 2000,
    durationDays: 365,
    status: "Repaid",
    hasSeguroFianca: false,
    tenantName: "Inquilino C.",
  },
  {
    id: "SEL-2026-004",
    landlordName: "Ana L.",
    propertyCity: "Santos, SP",
    principalBrz: 4_200,
    repaymentBrz: 4_620,
    rateBps: 2000,
    durationDays: 180,
    status: "Pending",   // não registrado on-chain ainda
    hasSeguroFianca: true,
    tenantName: "Inquilino D.",
  },
];

// Converte o id string em [u8; 32] pra passar pro instruction.
// Simplesmente encode UTF-8 e padeia com zeros.
export function contractIdBytes(id: string): number[] {
  const bytes = new TextEncoder().encode(id);
  const result = new Uint8Array(32);
  result.set(bytes.slice(0, 32));
  return Array.from(result);
}

// APR em string legível (bps → %)
export function formatRate(rateBps: number): string {
  return `${(rateBps / 100).toFixed(0)}% a.a.`;
}

// Retorno em R$ do landlord
export function interestBrz(r: MockReceivable): number {
  return r.repaymentBrz - r.principalBrz;
}

// ─────────────────────────────────────────────────────────────────────────────
// Display helpers — ported from Brix-handoff/brix/project/data.jsx
// ─────────────────────────────────────────────────────────────────────────────

export function fmtBRZ(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "BRZ 0";
  return "BRZ " + Math.round(n).toLocaleString("pt-BR");
}

export function fmtBRZShort(n: number): string {
  if (n >= 1_000_000)
    return "BRZ " + (n / 1_000_000).toFixed(2).replace(".", ",") + "M";
  if (n >= 1_000) return "BRZ " + (n / 1_000).toFixed(1).replace(".", ",") + "k";
  return fmtBRZ(n);
}

export function fmtPct(n: number): string {
  return (n * 100).toFixed(1).replace(".", ",") + "%";
}

export function shortAddr(a: string | null | undefined): string {
  return a ? a.slice(0, 4) + "…" + a.slice(-4) : "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Prototype seed data — used by the design surface (separate from on-chain
// MOCK_RECEIVABLES, which targets the program's instruction shape).
// ─────────────────────────────────────────────────────────────────────────────

export type ProtoStatus =
  | "pending"
  | "registered"
  | "funded"
  | "repaid"
  | "defaulted";

export interface ProtoReceivable {
  id: string;
  landlord: string;
  address: string;
  amount: number;
  term: number;
  rate: number;
  fee: boolean;
  status: ProtoStatus;
  funded: number;
  paid: number;
  total: number;
  fundedAt: string | null;
  wallet: string;
}

export const RECEIVABLES: ProtoReceivable[] = [
  { id: "BRX-0421", landlord: "Marina Toledo", address: "R. Augusta 1402, ap 81, SP", amount: 9600, term: 6, rate: 0.198, fee: true, status: "funded", funded: 8702, paid: 4, total: 6, fundedAt: "há 32 dias", wallet: "7xKZc2ePjfvKKeJqM8rCLJjHhd6iQjRkDw5yEFPkuD2T" },
  { id: "BRX-0419", landlord: "Eduardo Sampaio", address: "R. Joaquim Floriano 533, ap 122, SP", amount: 14400, term: 12, rate: 0.205, fee: true, status: "funded", funded: 13042, paid: 7, total: 12, fundedAt: "há 89 dias", wallet: "4mNqXr8YtBGfvHpL2zKjW9sQpRtAvXnYbCdEfGhIjKlM" },
  { id: "BRX-0425", landlord: "Camila Rezende", address: "Al. Lorena 1820, ap 64, SP", amount: 7200, term: 4, rate: 0.187, fee: true, status: "registered", funded: 0, paid: 0, total: 4, fundedAt: null, wallet: "9pQzR3sVxAaWcBdEfGhIjKlMnOpQrStUvWxYzAbCdEfG" },
  { id: "BRX-0426", landlord: "Roberto Falcão", address: "R. dos Pinheiros 1289, ap 41, SP", amount: 12000, term: 8, rate: 0.198, fee: true, status: "pending", funded: 0, paid: 0, total: 8, fundedAt: null, wallet: "2bVfMkLqRtYwZsXcVbNmAsDfGhJkLqWeRtYuIoPaSdFg" },
  { id: "BRX-0408", landlord: "Patrícia Antunes", address: "R. Cardeal Arcoverde 2401, ap 92, SP", amount: 6000, term: 3, rate: 0.182, fee: true, status: "repaid", funded: 6000, paid: 3, total: 3, fundedAt: "há 142 dias", wallet: "5wKpL8mNqRtYwZsXcVbNmAsDfGhJkLqWeRtYuIoPa3kJ" },
  { id: "BRX-0418", landlord: "Lucas Guimarães", address: "R. Bandeira Paulista 891, ap 152, SP", amount: 10800, term: 6, rate: 0.201, fee: true, status: "funded", funded: 9755, paid: 2, total: 6, fundedAt: "há 41 dias", wallet: "8jKpRtYwZsXcVbNmAsDfGhJkLqWeRtYuIoPaSdFgHjKl" },
  { id: "BRX-0420", landlord: "Júlia Vasconcellos", address: "R. Oscar Freire 1123, ap 71, SP", amount: 18000, term: 10, rate: 0.213, fee: false, status: "funded", funded: 16235, paid: 3, total: 10, fundedAt: "há 67 dias", wallet: "3rTyUiOpAsDfGhJkLqWeRtYuIoPaSdFgHjKlMnBvCxZw" },
  { id: "BRX-0422", landlord: "Felipe Marçal", address: "R. João Cachoeira 700, ap 32, SP", amount: 8400, term: 5, rate: 0.193, fee: true, status: "funded", funded: 7611, paid: 2, total: 5, fundedAt: "há 51 dias", wallet: "6yUiOpAsDfGhJkLqWeRtYuIoPaSdFgHjKlMnBvCxZwQe" },
  { id: "BRX-0413", landlord: "Ana Beatriz Rocha", address: "Al. Gabriel Monteiro da Silva 444, ap 21, SP", amount: 21600, term: 12, rate: 0.219, fee: true, status: "defaulted", funded: 19564, paid: 4, total: 12, fundedAt: "há 118 dias", wallet: "1qWeRtYuIoPaSdFgHjKlMnBvCxZwQeRtYuIoPaSdFgHj" },
];

export interface ProtoInvestor {
  wallet: string;
  shares: number;
  deposited: number;
  value: number;
  since: string;
  label?: string;
}

export const INVESTORS: ProtoInvestor[] = [
  { wallet: "7xKZ…uD2T", shares: 4280, deposited: 4000, value: 4392, since: "2026-02-14", label: "eu" },
  { wallet: "4mNq…IjKlM", shares: 12500, deposited: 12000, value: 12826, since: "2026-01-22" },
  { wallet: "9pQz…CdEfG", shares: 8000, deposited: 8000, value: 8211, since: "2026-03-04" },
];

// TVL chart series — 60 days, deterministic so SSR/CSR match.
export const TVL_SERIES: { d: number; value: number }[] = (() => {
  const days = 60;
  const out: { d: number; value: number }[] = [];
  // Deterministic pseudo-random: simple LCG seeded from index.
  const lcg = (i: number) => {
    const s = (i * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < days; i++) {
    const t = i / days;
    const drift =
      1800 * t + Math.sin(i * 0.4) * 600 + (lcg(i) * 400 - 200);
    const v = Math.max(
      15000,
      18000 + drift + (i > 45 ? (4200 * (i - 45)) / 15 : 0),
    );
    out.push({ d: i, value: Math.round(v) });
  }
  return out;
})();
