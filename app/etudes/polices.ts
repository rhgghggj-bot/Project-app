import { Caveat, Cormorant_SC, EB_Garamond, Lora } from "next/font/google"

// Polices proposées dans le Carnet, en plus de celles de l'appli (Geist,
// Bricolage, Geist Mono). Chargées seulement sur les pages qui les utilisent.
export const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" })
export const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" })

// Bibliothèque : texte des livres et titres en petites capitales
export const garamond = EB_Garamond({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-garamond", display: "swap" })
export const cormorant = Cormorant_SC({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-cormorant", display: "swap" })
