import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { sujet } = await request.json()
  
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: 'Genere 5 questions de quiz sur: ' + sujet + '. Reponds UNIQUEMENT en JSON sans markdown: {"titre":"...","questions":[{"question":"...","options":["A","B","C","D"],"reponse":0}]}'
    }]
  })

  const text = (message.content[0] as any).text
  const parsed = JSON.parse(text)
  return NextResponse.json(parsed)
}
