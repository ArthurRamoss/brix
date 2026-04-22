"use client";

import { usePrivy } from "@privy-io/react-auth";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { useState } from "react";
import { toast } from "sonner";
import {
  MOCK_RECEIVABLES,
  MockReceivable,
  ReceivableStatus,
  contractIdBytes,
  formatRate,
  interestBrz,
} from "../../lib/mock-data";
import { getBrixProgram, BRZ_MINT, VAULT_ADMIN, deriveVaultPDA } from "../../lib/brix-program";

// Badge de status colorido
function StatusBadge({ status }: { status: ReceivableStatus }) {
  const styles: Record<ReceivableStatus, string> = {
    Pending:    "bg-zinc-800 text-zinc-400 border-zinc-700",
    Registered: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    Funded:     "bg-amber-500/10 text-amber-400 border-amber-500/30",
    Repaid:     "bg-green-500/10 text-green-400 border-green-500/30",
  };
  const labels: Record<ReceivableStatus, string> = {
    Pending:    "Pendente",
    Registered: "Registrado",
    Funded:     "Financiado ✓",
    Repaid:     "Repago ✓",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// Card de um recebível individual
function ReceivableCard({
  receivable,
  onAntecipar,
  loading,
}: {
  receivable: MockReceivable;
  onAntecipar: (r: MockReceivable) => void;
  loading: boolean;
}) {
  const canAntecipar = receivable.status === "Pending";
  const interest = interestBrz(receivable);

  return (
    <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-zinc-100">{receivable.landlordName}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {receivable.propertyCity} · {receivable.id}
          </p>
        </div>
        <StatusBadge status={receivable.status} />
      </div>

      {/* Valores */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-zinc-600 text-xs mb-0.5">Antecipação</p>
          <p className="font-semibold text-zinc-100">
            R$ {receivable.principalBrz.toLocaleString("pt-BR")}
          </p>
        </div>
        <div>
          <p className="text-zinc-600 text-xs mb-0.5">Juros (fixos)</p>
          <p className="font-semibold text-amber-400">
            + R$ {interest.toLocaleString("pt-BR")}
          </p>
        </div>
        <div>
          <p className="text-zinc-600 text-xs mb-0.5">Taxa / Prazo</p>
          <p className="font-semibold text-zinc-300">
            {formatRate(receivable.rateBps)} · {receivable.durationDays}d
          </p>
        </div>
      </div>

      {/* Seguro fiança */}
      <div className="flex items-center gap-2">
        {receivable.hasSeguroFianca ? (
          <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
            🛡️ Seguro fiança ativo
          </span>
        ) : (
          <span className="text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
            Sem seguro fiança
          </span>
        )}
        <span className="text-xs text-zinc-600">Inquilino: {receivable.tenantName}</span>
      </div>

      {/* CTA */}
      {canAntecipar && (
        <button
          onClick={() => onAntecipar(receivable)}
          disabled={loading}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors text-sm"
        >
          {loading ? "Processando..." : `Antecipar R$ ${receivable.principalBrz.toLocaleString("pt-BR")}`}
        </button>
      )}

      {/* Estado final */}
      {receivable.status === "Funded" && (
        <div className="text-xs text-zinc-500 text-center py-1">
          BRZ enviado → mock PIX R$ {receivable.principalBrz.toLocaleString("pt-BR")} ✓
        </div>
      )}
      {receivable.status === "Repaid" && (
        <div className="text-xs text-green-600 text-center py-1">
          Repago ao vault — investidores receberam juros ✓
        </div>
      )}
    </div>
  );
}

// --- Página principal ---

export default function LandlordPage() {
  const { login, authenticated, ready, logout, user } = usePrivy();

  const [receivables, setReceivables] = useState<MockReceivable[]>(MOCK_RECEIVABLES);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Busca a wallet Solana do usuário via linkedAccounts (não via useWallets que é EVM-only)
  const solanaLinkedWallet = user?.linkedAccounts.find(
    (a) => a.type === "wallet" && "chainType" in a && a.chainType === "solana",
  );
  const walletAddress = solanaLinkedWallet
    ? (solanaLinkedWallet as { address: string }).address
    : null;

  // register_receivable + fund_landlord em sequência
  async function handleAntecipar(r: MockReceivable) {
    if (!walletAddress || !authenticated) {
      toast.error("Conecte sua carteira primeiro.");
      login();
      return;
    }

    setLoadingId(r.id);

    const loadingToast = toast.loading(`Registrando contrato ${r.id}...`);

    try {
      // Para o demo, usamos VAULT_ADMIN como signer placeholder.
      // Em produção: a embedded Solana wallet do Privy assina via useSignTransaction.
      // Integração real com signing será feita no CP3 quando o seed-demo.ts estiver pronto.
      const agencyPubkey = new PublicKey(walletAddress);
      const anchorWallet = {
        publicKey: agencyPubkey,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signTransaction: async (tx: any) => tx, // placeholder — Privy sign integrado no CP3
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signAllTransactions: async (txs: any[]) => txs,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const program = getBrixProgram(anchorWallet as any);
      const [vaultPDA] = deriveVaultPDA();

      // --- STEP 1: register_receivable ---
      // Registra o recebível on-chain. O contrato ID é um [u8;32] derivado do slug.
      // Analogia: INSERT INTO receivables (contract_id, principal, ...) VALUES (...)
      //           feito pelo programa Rust, não pelo backend — imutável no histórico da blockchain.
      const contractId = contractIdBytes(r.id);
      const principalLamports = new BN(r.principalBrz * 1_000_000);  // BRZ 6 decimais
      const repaymentLamports = new BN(r.repaymentBrz * 1_000_000);

      // Para o demo, usamos a wallet do usuário como "landlord" também.
      // Em produção, seria a wallet da Selectimob/do proprietário real.
      const landlordPubkey = agencyPubkey;

      toast.loading(`Step 1/2 — Registrando on-chain...`, { id: loadingToast });

      const registerSig = await program.methods
        .registerReceivable(
          contractId,
          principalLamports,
          repaymentLamports,
          r.rateBps,
          r.durationDays,
        )
        .accounts({
          agency: anchorWallet.publicKey,
          vault: vaultPDA,
          landlord: landlordPubkey,
        })
        .rpc();

      // --- STEP 2: fund_landlord ---
      // Transfere BRZ do vault pra ATA do landlord.
      // PDA "assina" a transferência via signer_seeds (o vault autoriza de si mesmo).
      // Analogia: é como um Escrow que libera fundos automaticamente quando a condição é satisfeita.
      toast.loading(`Step 2/2 — Liberando BRZ para o proprietário...`, { id: loadingToast });

      const landlordBrzAta = getAssociatedTokenAddressSync(BRZ_MINT, landlordPubkey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vault = await (program.account as any).vault.fetch(vaultPDA);

      await program.methods
        .fundLandlord(contractId)
        .accounts({
          agency: anchorWallet.publicKey,
          vaultAta: new PublicKey(vault.vaultAta),
          landlordBrzAta,
          landlord: landlordPubkey,
        })
        .rpc();

      // Atualiza estado local do mock
      setReceivables((prev) =>
        prev.map((item) =>
          item.id === r.id ? { ...item, status: "Funded" as ReceivableStatus } : item,
        ),
      );

      toast.dismiss(loadingToast);
      toast.success(`✓ R$ ${r.principalBrz.toLocaleString("pt-BR")} antecipado!`, {
        description: `Explorer: https://explorer.solana.com/tx/${registerSig}?cluster=devnet`,
      });
    } catch (err: unknown) {
      toast.dismiss(loadingToast);
      const msg = err instanceof Error ? err.message : String(err);

      // Erro esperado em devnet antes do seed: vault não inicializado
      if (msg.includes("Account does not exist")) {
        toast.error("Vault não encontrado no devnet", {
          description: "Rode scripts/seed-demo.ts pra inicializar o vault e mintar BRZ de teste.",
        });
        // Simula o fluxo pra fins de demo visual
        setTimeout(() => {
          setReceivables((prev) =>
            prev.map((item) =>
              item.id === r.id ? { ...item, status: "Funded" as ReceivableStatus } : item,
            ),
          );
          toast.success(`Demo: R$ ${r.principalBrz.toLocaleString("pt-BR")} → PIX (simulado)`, {
            description: "Vault será seedado no CP3.",
          });
        }, 800);
      } else {
        toast.error("Falha na antecipação", { description: msg });
      }
    } finally {
      setLoadingId(null);
    }
  }

  const pendingCount = receivables.filter((r) => r.status === "Pending").length;
  const fundedCount = receivables.filter((r) => r.status === "Funded").length;
  const totalPrincipal = receivables
    .filter((r) => r.status !== "Repaid")
    .reduce((s, r) => s + r.principalBrz, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <a href="/" className="text-amber-400 font-bold text-xl tracking-tight">
          BRIX
        </a>
        <div className="flex items-center gap-4">
          <a href="/invest" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Investidores
          </a>
          {ready && !authenticated && (
            <button
              onClick={login}
              className="text-sm bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Entrar
            </button>
          )}
          {authenticated && walletAddress && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
              <button onClick={logout} className="text-xs text-zinc-600 hover:text-zinc-400">
                Sair
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-zinc-100">
              Portal Selectimob
            </h1>
            <span className="text-xs px-2 py-0.5 rounded border border-zinc-700 text-zinc-500">
              Imobiliária parceira
            </span>
          </div>
          <p className="text-zinc-500">
            Contratos com seguro fiança. Proprietários recebem BRZ → PIX.
          </p>
        </div>

        {/* Stats resumo */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Pendentes</p>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Financiados</p>
            <p className="text-2xl font-bold text-amber-400">{fundedCount}</p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Volume</p>
            <p className="text-2xl font-bold">R$ {totalPrincipal.toLocaleString("pt-BR")}</p>
          </div>
        </div>

        {/* Lista de recebíveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {receivables.map((r) => (
            <ReceivableCard
              key={r.id}
              receivable={r}
              onAntecipar={handleAntecipar}
              loading={loadingId === r.id}
            />
          ))}
        </div>

        {/* Info sobre o fluxo */}
        <div className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/20 space-y-2">
          <p className="text-sm font-semibold text-zinc-400">Como funciona o fluxo on-chain</p>
          <ol className="text-xs text-zinc-600 space-y-1 list-decimal list-inside">
            <li>
              <strong className="text-zinc-500">register_receivable</strong> — Selectimob registra o contrato
              no program (taxa imutável gravada no estado da conta Solana).
            </li>
            <li>
              <strong className="text-zinc-500">fund_landlord</strong> — Vault transfere BRZ pra ATA do
              proprietário. PDA do vault assina via <code>signer_seeds</code> (sem private key).
            </li>
            <li>
              <strong className="text-zinc-500">repay</strong> — Selectimob repassa aluguel mensal →
              vault. Juros sobem o price-per-share dos investidores.
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
