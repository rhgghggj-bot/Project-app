import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation"
import JarvisButton from "./components/JarvisButton";
import PushNotifSetup from "./components/PushNotifSetup";
import SplashWrapper from "./components/SplashWrapper";
import PageFrame from "./components/PageFrame";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description = "Nexia — Ton hub de vie. Finances, calendrier, groupes et fiscalité suisse."

export const metadata: Metadata = {
  metadataBase: new URL("https://project-app-rust-delta.vercel.app"),
  title: "Nexia - Ton hub de vie",
  icons: { icon: "/favicon.svg" },
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
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "Nexia - Ton hub de vie",
    description,
    images: ["/icon-512.png"],
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
          <JarvisButton />
          <PushNotifSetup />
          <PageFrame>{children}</PageFrame>
        </SplashWrapper>
      </body>
    </html>
  );
}
