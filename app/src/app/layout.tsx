import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "../providers/privy-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brix — Antecipação de Aluguel On-Chain",
  description:
    "Protocolo Solana que tokeniza recebíveis de aluguel com taxa imutável em smart contract. Brazil-first via Selectimob.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Providers precisa ser "use client", por isso fica num arquivo separado.
          O layout.tsx em si pode ser server component — Next.js App Router padrão. */}
      <body className="min-h-full flex flex-col bg-[#0f0f0f] text-zinc-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
