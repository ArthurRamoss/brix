"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export default function Home() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  function handleCTA() {
    if (authenticated) {
      router.push("/invest");
    } else {
      login();
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold text-xl tracking-tight">
            BRIX
          </span>
          <span className="text-zinc-500 text-xs px-2 py-0.5 rounded border border-zinc-700">
            devnet
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/landlord"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Sou proprietário
          </a>
          <a
            href="/invest"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Sou investidor
          </a>
          {ready && !authenticated && (
            <button
              onClick={login}
              className="text-sm bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Entrar
            </button>
          )}
          {authenticated && (
            <a
              href="/invest"
              className="text-sm bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Ir para o app →
            </a>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            RWA Lending · Solana devnet · ~20% APR
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Sua renda de aluguel,{" "}
            <span className="text-amber-400">hoje.</span>
          </h1>

          {/* Sub */}
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Antecipe meses de aluguel com taxa gravada em smart contract —{" "}
            <span className="text-zinc-200">impossível de mudar</span>. Sem
            bait-and-switch. Sem surpresas na assinatura.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleCTA}
              disabled={!ready}
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl text-lg transition-colors"
            >
              {!ready
                ? "Carregando..."
                : authenticated
                  ? "Ir para o app →"
                  : "Começar agora"}
            </button>
            <a
              href="/landlord"
              className="w-full sm:w-auto px-8 py-4 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold rounded-xl text-lg transition-colors"
            >
              Sou proprietário
            </a>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-20">
          {[
            {
              icon: "🔒",
              title: "Taxa imutável",
              desc: "A taxa é gravada no smart contract no momento do contrato. Ninguém pode alterar depois.",
            },
            {
              icon: "🛡️",
              title: "Seguro fiança",
              desc: "~85% dos contratos Selectimob já têm seguro fiança. Inadimplência do inquilino não te afeta.",
            },
            {
              icon: "⚡",
              title: "Solana",
              desc: "400ms de finalidade, $0.00025 por tx. O protocolo é barato o suficiente pra ser viável em BRL.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-left"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-zinc-100 mb-1">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Proof */}
        <p className="mt-16 text-sm text-zinc-600">
          Construído para o{" "}
          <span className="text-zinc-500">Colosseum Frontier · Maio 2026</span>{" "}
          · Program:{" "}
          <a
            href={`https://explorer.solana.com/address/${process.env.NEXT_PUBLIC_BRIX_PROGRAM_ID}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:text-amber-400 font-mono text-xs transition-colors"
          >
            6xonaQdm...
          </a>
        </p>
      </main>
    </div>
  );
}
