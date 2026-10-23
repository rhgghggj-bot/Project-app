import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./transitions.css";
import Navigation from "./components/Navigation"
import RappelsEvenements from "./components/RappelsEvenements";
import ClavierConfort from "./components/ClavierConfort";
import SplashWrapper from "./components/SplashWrapper";
import PageFrame from "./components/PageFrame";
import Toaster from "./components/Toaster";
import BandeauCookies from "./components/BandeauCookies";
import SuiviErreurs from "./components/SuiviErreurs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Police d'affichage (titres, montants) : un grotesque chaleureux, plus
// "entre amis" que bancaire, qui tranche avec le texte courant en Geist.
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description = "Nexia — Ton hub de vie. Espace étudiant (notes, cartes de révision, planning d'examen, bibliothèque), finances, calendrier, groupes et fiscalité suisse."

export const metadata: Metadata = {
  metadataBase: new URL("https://project-app-rust-delta.vercel.app"),
  title: { default: "Nexia - Ton hub de vie", template: "%s · Nexia" },
  icons: { icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/favicon.svg", type: "image/svg+xml" }] },
  description,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexia",
  },
  openGraph: {
    title: "Nexia - Ton hub de vie",
    description,
    siteName: "Nexia",
    locale: "fr_CH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexia - Ton hub de vie",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nexia" />
        <meta name="theme-color" content="#0A1628" />
        {/* Apparence choisie (auto / clair / sombre), appliquée avant l'affichage pour éviter un flash */}
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem("theme")||"auto"}catch(e){document.documentElement.dataset.theme="auto"}` }} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} antialiased`}>
        <SplashWrapper>
          <Navigation />
          <RappelsEvenements />
          <ClavierConfort />
          <PageFrame>{children}</PageFrame>
          <Toaster />
          <BandeauCookies />
          <SuiviErreurs />
        </SplashWrapper>
        {/* Statistiques de visite et de vitesse anonymes, sans cookies
            (seulement sur Vercel, où les scripts existent) */}
        {process.env.VERCEL === "1" && <><Analytics /><SpeedInsights /></>}
      </body>
    </html>
  );
}
