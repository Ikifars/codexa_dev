import { NextResponse } from 'next/server'
import { AdminApiError } from '@/lib/supabase/server-client'
import { requireWorkspacePermission } from '@/lib/supabase/workspace-auth'

const defaultSettings = [
  ['create_task', 'Criar tarefas', 10], ['complete_task', 'Concluir tarefas', 25], ['complete_task_on_time', 'Concluir no prazo', 40], ['resolve_ticket', 'Resolver chamados', 50], ['resolve_support_ticket', 'Resolver suporte', 60], ['approve_change_request', 'Aprovar alterações', 35], ['deliver_project', 'Entregar projetos', 100], ['deliver_project_milestone', 'Entregar marcos', 100], ['close_sale', 'Fechar vendas', 120], ['close_contract', 'Fechar contratos', 180], ['win_lead', 'Converter leads', 150], ['achieve_goal', 'Atingir metas', 120], ['create_document', 'Publicar documentos', 15], ['assign_badge', 'Receber emblemas', 25], ['receive_positive_feedback', 'Receber feedback positivo', 30],
] as const

export async function GET() {
  try {
    const actor = await requireWorkspacePermission('badges', 'manage')
    const { data, error } = await actor.supabase.from('xp_action_settings').select('action_key,label,xp_amount,is_active').order('label')
    if (error) throw new AdminApiError('Não foi possível carregar as regras de XP. A migração do motor de XP precisa ser aplicada.', 503)
    let settings = data ?? []
    const existingKeys = new Set(settings.map((setting) => setting.action_key))
    const missing = defaultSettings.filter(([action_key]) => !existingKeys.has(action_key)).map(([action_key, label, xp_amount]) => ({ action_key, label, xp_amount, is_active: true }))
    if (missing.length) {
      const { data: seeded, error: seedError } = await actor.supabase.from('xp_action_settings').upsert(missing, { onConflict: 'action_key' }).select('action_key,label,xp_amount,is_active')
      if (!seedError && seeded) settings = [...settings, ...seeded].sort((a, b) => a.label.localeCompare(b.label))
    }
    return NextResponse.json({ settings }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return respond(error) }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireWorkspacePermission('badges', 'manage')
    const body = await request.json() as { actionKey?: string; xpAmount?: number; isActive?: boolean }
    const xpAmount = Number(body.xpAmount)
    if (!body.actionKey || !Number.isInteger(xpAmount) || xpAmount < 0 || xpAmount > 10000) return NextResponse.json({ error: 'Informe uma quantidade inteira de XP entre 0 e 10.000.' }, { status: 400 })
    const { data, error } = await actor.supabase.from('xp_action_settings').update({ xp_amount: xpAmount, is_active: body.isActive !== false, updated_at: new Date().toISOString() }).eq('action_key', body.actionKey).select('action_key,label,xp_amount,is_active').single()
    if (error || !data) throw new AdminApiError('Não foi possível salvar a regra de XP.', 503)
    return NextResponse.json({ setting: data })
  } catch (error) { return respond(error) }
}

function respond(error: unknown) { if (error instanceof AdminApiError) return NextResponse.json({ error: error.message }, { status: error.status }); console.error('XP settings failed:', error); return NextResponse.json({ error: 'Não foi possível atualizar as regras de XP.' }, { status: 500 }) }
