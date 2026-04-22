"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useState } from "react";
import { useBrix, formatBrz } from "../../hooks/use-brix";
import { PROGRAM_ID } from "../../lib/brix-program";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50">
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function InvestPage() {
  const { login, authenticated, ready, logout } = usePrivy();
  const {
    vaultData,
    positionData,
    isLoading,
    walletAddress,
    deposit,
    withdraw,
  } = useBrix();

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAll, setWithdrawAll] = useState(false);

  const aprPercent = vaultData ? (vaultData.aprBps / 100).toFixed(0) : "~20";
  const tvlFormatted = vaultData
    ? formatBrz(vaultData.totalAssets)
    : "–";
  const deployedFormatted = vaultData
    ? formatBrz(vaultData.totalDeployed)
    : "–";

  async function handleDeposit() {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;
    await deposit(amount);
    setDepositAmount("");
  }

  async function handleWithdraw() {
    if (!positionData) return;
    const shares = withdrawAll
      ? positionData.shares
      : positionData.shares / 2n; // saca metade pra demo se não quiser tudo
    await withdraw(shares);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <a href="/" className="text-amber-400 font-bold text-xl tracking-tight">
          BRIX
        </a>
        <div className="flex items-center gap-4">
          <a href="/landlord" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Proprietários
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
              <button
                onClick={logout}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Vault de Investimento</h1>
          <p className="text-zinc-500 mt-1">
            Deposite BRZ e receba yield de recebíveis de aluguel com seguro fiança.
          </p>
          <a
            href={`https://explorer.solana.com/address/${PROGRAM_ID.toBase58()}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-zinc-700 hover:text-amber-500 transition-colors mt-1 inline-block"
          >
            Program: {PROGRAM_ID.toBase58().slice(0, 16)}... ↗
          </a>
        </div>

        {/* Vault stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="TVL"
            value={`BRZ ${tvlFormatted}`}
            sub="Total no vault"
          />
          <StatCard
            label="Deployado"
            value={`BRZ ${deployedFormatted}`}
            sub="Em recebíveis ativos"
          />
          <StatCard
            label="APR Est."
            value={`${aprPercent}%`}
            sub="Taxa média dos contratos"
          />
          <StatCard
            label="Status"
            value={vaultData?.paused ? "Pausado" : "Ativo"}
            sub={vaultData ? "Vault inicializado" : "Aguardando seed"}
          />
        </div>

        {/* Posição do investidor */}
        {authenticated && positionData && (
          <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <p className="text-sm text-amber-400 font-semibold mb-3">Sua posição</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 text-xs mb-0.5">Shares</p>
                <p className="font-mono font-semibold">{positionData.shares.toString()}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-0.5">Valor estimado</p>
                <p className="font-semibold">BRZ {formatBrz(positionData.estimatedValueBrz)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-0.5">Total depositado</p>
                <p className="font-semibold">BRZ {formatBrz(positionData.totalDeposited)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulário de deposit/withdraw */}
        {!authenticated ? (
          <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900/30 text-center space-y-4">
            <p className="text-zinc-400">Faça login para depositar e acompanhar sua posição.</p>
            <button
              onClick={login}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors"
            >
              Entrar com e-mail
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Depositar */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4">
              <h2 className="font-semibold text-zinc-100">Depositar BRZ</h2>
              <p className="text-xs text-zinc-500">
                Você recebe shares LP proporcionais. O valor das shares sobe conforme
                os recebíveis são repagos com juros.
              </p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="100.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <span className="flex items-center px-3 text-sm text-zinc-500 bg-zinc-800 border border-zinc-700 rounded-lg">
                    BRZ
                  </span>
                </div>
                <button
                  onClick={handleDeposit}
                  disabled={isLoading || !depositAmount || parseFloat(depositAmount) <= 0}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors text-sm"
                >
                  {isLoading ? "Processando..." : "Depositar"}
                </button>
              </div>
              {/* Aviso devnet BRZ */}
              <div className="p-3 rounded-lg bg-zinc-800/60 border border-zinc-700">
                <p className="text-xs text-zinc-500">
                  ⚠️ Em devnet você precisa de <strong className="text-zinc-300">BRZ de teste</strong> na sua wallet.
                  Rode <code className="text-amber-400">scripts/seed-demo.ts</code> no CP3 pra receber BRZ fake.
                </p>
              </div>
            </div>

            {/* Sacar */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4">
              <h2 className="font-semibold text-zinc-100">Sacar BRZ</h2>
              <p className="text-xs text-zinc-500">
                Queima suas shares e recebe BRZ de volta com os juros proporcionais acumulados.
              </p>
              {positionData && positionData.shares > 0n ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-zinc-800/60 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Shares disponíveis</span>
                      <span className="font-mono">{positionData.shares.toString()}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-zinc-500">Valor estimado</span>
                      <span className="text-amber-400">
                        BRZ {formatBrz(positionData.estimatedValueBrz)}
                      </span>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={withdrawAll}
                      onChange={(e) => setWithdrawAll(e.target.checked)}
                      className="accent-amber-500"
                    />
                    Sacar tudo
                  </label>
                  <button
                    onClick={handleWithdraw}
                    disabled={isLoading}
                    className="w-full py-3 border border-zinc-600 hover:border-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 hover:text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    {isLoading ? "Processando..." : withdrawAll ? "Sacar tudo" : "Sacar 50%"}
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-zinc-800/60 text-xs text-zinc-500">
                  Você ainda não tem posição neste vault. Faça um depósito primeiro.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
