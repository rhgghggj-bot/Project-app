import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { base64, mediaType } = await req.json()
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType || "image/jpeg", data: base64 }
          },
          {
            type: "text",
            text: `Analyse ce document et extrais les informations importantes. Réponds UNIQUEMENT en JSON valide sans markdown:
{
  "type": "facture" ou "releve_bancaire" ou "contrat" ou "assurance" ou "autre",
  "titre": "nom du document ou de l'entreprise",
  "montant": nombre ou null,
  "date": "date trouvée ou null",
  "description": "résumé en une phrase",
  "transactions": [{"nom": "...", "montant": nombre, "type": "depense" ou "revenu"}],
  "infos_cles": ["info 1", "info 2", "info 3"]
}`
          }
        ]
      }]
    })
  })
  
  const data = await response.json()
  const text = data.content[0].text
  const clean = text.replace(/```json|```/g, "").trim()
  
  try {
    return NextResponse.json(JSON.parse(clean))
  } catch {
    return NextResponse.json({ type: "autre", titre: "Document", description: "Analyse terminée.", infos_cles: [], transactions: [] })
  }
}
