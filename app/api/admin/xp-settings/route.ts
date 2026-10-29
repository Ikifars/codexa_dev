import { NextResponse } from 'next/server'
import { AdminApiError } from '@/lib/supabase/server-client'
import { requireWorkspacePermission } from '@/lib/supabase/workspace-auth'

export async function GET() {
  try {
    const actor = await requireWorkspacePermission('badges', 'manage')
    const { data, error } = await actor.supabase.from('xp_action_settings').select('action_key,label,xp_amount,is_active').order('label')
    if (error) throw new AdminApiError('Não foi possível carregar as regras de XP. A migração do motor de XP precisa ser aplicada.', 503)
    return NextResponse.json({ settings: data ?? [] }, { headers: { 'Cache-Control': 'private, no-store' } })
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
