import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "GreenLog OS - Dashboard de Maintenance Golf",
  description: "Plateforme SaaS de gestion d'incidents pour les golfs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="bg-[#F9FAFB] text-[#0F172A] antialiased">{children}</body>
    </html>
  );
}
