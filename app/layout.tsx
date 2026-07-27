import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation"
import PushNotifSetup from "./components/PushNotifSetup";
import SplashWrapper from "./components/SplashWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexia - Ton hub de vie",
    icons: { icon: "/favicon.svg" },
  description: "Nexia — Ton hub de vie. Finances, calendrier, groupes et fiscalité suisse.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexia",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nexia" />
        <meta name="theme-color" content="#2B7FFF" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SplashWrapper>
          <Navigation />
          <PushNotifSetup />
          <div style={{paddingBottom:"90px",paddingTop:"calc(44px + env(safe-area-inset-top))"}} className="md:pt-0">{children}</div>
        </SplashWrapper>
      </body>
    </html>
  );
}
