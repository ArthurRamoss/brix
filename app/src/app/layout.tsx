import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "../providers/privy-provider";
import { LangProvider } from "../lib/i18n";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brix — antecipação de aluguel on-chain",
  description:
    "vault on-chain lastreado em recebíveis de aluguel. taxa imutável gravada em smart contract. brasil-first via imobiliárias parceiras.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${plexSans.variable} ${plexMono.variable}`}
    >
      <body>
        <LangProvider>
          <Providers>{children}</Providers>
        </LangProvider>
      </body>
    </html>
  );
}
