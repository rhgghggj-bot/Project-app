import { Caveat, Lora } from "next/font/google"

// Polices proposées dans le Carnet, en plus de celles de l'appli (Geist,
// Bricolage, Geist Mono). Chargées seulement sur les pages qui les utilisent.
export const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" })
export const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" })
