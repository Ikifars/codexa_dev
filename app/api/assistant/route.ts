import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { NextResponse } from 'next/server'
import { getWorkspaceActor } from '@/lib/supabase/workspace-auth'

export const maxDuration = 60

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) return NextResponse.json({ error: 'OpenRouter não configurada: defina OPENROUTER_API_KEY e OPENROUTER_MODEL.' }, { status: 503 })
  try {
    const openrouter = createOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      headers: { 'HTTP-Referer': process.env.SITE_URL ?? 'https://codexa.dev', 'X-Title': 'Codexa Assistant' },
    })
    await getWorkspaceActor()
    const body = await request.json() as { messages?: UIMessage[]; context?: string }
    if (!Array.isArray(body.messages) || body.messages.length === 0) return NextResponse.json({ error: 'Envie uma mensagem.' }, { status: 400 })
    const result = streamText({
      model: openrouter(process.env.OPENROUTER_MODEL),
      system: `Você é o assistente da Codexa, um ERP/CRM empresarial. Responda em português do Brasil, com objetividade e clareza. Ajude o usuário a encontrar módulos, entender dados e executar fluxos do workspace. Não invente dados, permissões ou ações realizadas. Quando faltar contexto, faça uma pergunta curta. Contexto atual: ${body.context ?? 'workspace Codexa'}`,
      messages: await convertToModelMessages(body.messages),
      maxOutputTokens: 900,
    })
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[v0] Assistant request failed:', error)
    return NextResponse.json({ error: 'Não foi possível responder agora.' }, { status: 500 })
  }
}
