import { NextResponse } from 'next/server'
import { AdminApiError } from '@/lib/supabase/server-client'
import { requireWorkspacePermission } from '@/lib/supabase/workspace-auth'

export async function POST(request: Request) {
  try {
    const actor = await requireWorkspacePermission('badges', 'manage')
    const body = await request.json() as { badgeId?: unknown; memberId?: unknown }
    if (typeof body.badgeId !== 'string' || typeof body.memberId !== 'string') return NextResponse.json({ error: 'Emblema ou membro inválido.' }, { status: 400 })
    const { data: badge } = await actor.supabase.from('profile_badges').select('id,name,description,color,image_path,is_temporary,duration_days,assignment_expires_at').eq('id', body.badgeId).is('member_id', null).maybeSingle()
    if (!badge) return NextResponse.json({ error: 'Emblema não encontrado na biblioteca.' }, { status: 404 })
    if (badge.is_temporary && badge.assignment_expires_at && new Date(badge.assignment_expires_at) <= new Date()) return NextResponse.json({ error: 'O período de atribuição deste emblema terminou.' }, { status: 410 })
    const { data: existing } = await actor.supabase.from('profile_badges').select('id').eq('source_badge_id', badge.id).eq('member_id', body.memberId).maybeSingle()
    if (existing) return NextResponse.json({ error: 'Este usuário já recebeu esse emblema.' }, { status: 409 })
    const { data: member } = await actor.supabase.from('team_members').select('id,xp,level,status').eq('id', body.memberId).maybeSingle()
    if (!member || !['active', 'ativo', 'enabled', 'habilitado'].includes(String(member.status).toLowerCase().replaceAll('"', ''))) return NextResponse.json({ error: 'Membro não encontrado ou inativo.' }, { status: 404 })
    const { error } = await actor.supabase.from('profile_badges').insert({ source_badge_id: badge.id, member_id: member.id, name: badge.name, description: badge.description, color: badge.color, image_path: badge.image_path, is_temporary: badge.is_temporary, duration_days: badge.duration_days, expires_at: null, granted_by: actor.memberId, granted_at: new Date().toISOString() })
    if (error) throw new AdminApiError('Não foi possível atribuir o emblema. Aplique a migração de catálogo de emblemas no Supabase.', 503)
    const nextXp = Number(member.xp ?? 0) + 100; const nextLevel = Math.max(Number(member.level ?? 1), Math.floor(nextXp / 250) + 1)
    await actor.supabase.from('team_members').update({ xp: nextXp, level: nextLevel }).eq('id', member.id)
    return NextResponse.json({ ok: true, badge: badge.name, xp: nextXp, level: nextLevel })
  } catch (error) { if (error instanceof AdminApiError) return NextResponse.json({ error: error.message }, { status: error.status }); console.error('Badge assignment failed:', error); return NextResponse.json({ error: 'Não foi possível atribuir o emblema.' }, { status: 500 }) }
}
