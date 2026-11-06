import { deepseek } from '@ai-sdk/deepseek'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { NextResponse } from 'next/server'
import { getWorkspaceActor } from '@/lib/supabase/workspace-auth'

export const maxDuration = 60

export async function POST(request: Request) {
  if (!process.env.DEEPSEEK_API_KEY) return NextResponse.json({ error: 'DEEPSEEK_API_KEY não configurada.' }, { status: 503 })
  try {
    await getWorkspaceActor()
    const body = await request.json() as { messages?: UIMessage[]; context?: string }
    if (!Array.isArray(body.messages) || body.messages.length === 0) return NextResponse.json({ error: 'Envie uma mensagem.' }, { status: 400 })
    const result = streamText({
      model: deepseek('deepseek-v4-flash'),
      system: `Você é o assistente da Codexa, um ERP/CRM empresarial. Responda em português do Brasil, com objetividade e clareza. Ajude o usuário a encontrar módulos, entender dados e executar fluxos do workspace. Não invente dados, permissões ou ações realizadas. Quando faltar contexto, faça uma pergunta curta. Contexto atual: ${body.context ?? 'workspace Codexa'}`,
      messages: await convertToModelMessages(body.messages),
      maxOutputTokens: 900,
      providerOptions: { deepseek: { thinking: { type: 'disabled' } } },
    })
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[v0] Assistant request failed:', error)
    return NextResponse.json({ error: 'Não foi possível responder agora.' }, { status: 500 })
  }
}
