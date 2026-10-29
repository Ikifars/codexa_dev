import { NextResponse } from 'next/server'
import { AdminApiError } from '@/lib/supabase/server-client'
import { requireWorkspacePermission } from '@/lib/supabase/workspace-auth'

export async function POST(request: Request) {
  try {
    const actor = await requireWorkspacePermission('badges', 'manage')
    const body = await request.json() as { badgeId?: unknown; memberId?: unknown }
    if (typeof body.badgeId !== 'string' || typeof body.memberId !== 'string') return NextResponse.json({ error: 'Emblema ou membro inválido.' }, { status: 400 })
    const { data: badge } = await actor.supabase.from('profile_badges').select('id,name').eq('id', body.badgeId).is('member_id', null).maybeSingle()
    if (!badge) return NextResponse.json({ error: 'Emblema não encontrado na biblioteca.' }, { status: 404 })
    const { data: member } = await actor.supabase.from('team_members').select('id,xp,level,status').eq('id', body.memberId).maybeSingle()
    if (!member || !['active', 'ativo', 'enabled', 'habilitado'].includes(String(member.status).toLowerCase().replaceAll('"', ''))) return NextResponse.json({ error: 'Membro não encontrado ou inativo.' }, { status: 404 })
    const { error } = await actor.supabase.from('profile_badges').update({ member_id: member.id, granted_by: actor.memberId, granted_at: new Date().toISOString() }).eq('id', badge.id).is('member_id', null)
    if (error) throw new AdminApiError('Não foi possível atribuir o emblema.', 503)
    const nextXp = Number(member.xp ?? 0) + 100; const nextLevel = Math.max(Number(member.level ?? 1), Math.floor(nextXp / 250) + 1)
    await actor.supabase.from('team_members').update({ xp: nextXp, level: nextLevel }).eq('id', member.id)
    return NextResponse.json({ ok: true, badge: badge.name, xp: nextXp, level: nextLevel })
  } catch (error) { if (error instanceof AdminApiError) return NextResponse.json({ error: error.message }, { status: error.status }); console.error('Badge assignment failed:', error); return NextResponse.json({ error: 'Não foi possível atribuir o emblema.' }, { status: 500 }) }
}
