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
