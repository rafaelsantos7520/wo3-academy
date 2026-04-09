import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ozon Academy W03",
  description: "Plataforma oficial de treinamento da linha WO3 — protocolos, ciência e prática para profissionais.",
  icons: {
    icon: "/vp-logo.svg",
    shortcut: "/vp-logo.svg",
    apple: "/vp-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${spaceGrotesk.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
