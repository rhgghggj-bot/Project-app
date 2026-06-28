"use client"
import { useEffect, useRef } from "react"
import QRCode from "qrcode"

export default function QRCodeComponent({ lien }: { lien: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && lien) {
      QRCode.toCanvas(canvasRef.current, `https://revolut.me/${lien}`, {
        width: 120,
        margin: 1,
        color: { dark: "#5B21B6", light: "#F5F3FF" }
      })
    }
  }, [lien])

  return (
    <canvas ref={canvasRef} className="rounded-lg" />
  )
}
