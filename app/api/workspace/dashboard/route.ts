import { NextResponse } from 'next/server'
import { AdminApiError } from '@/lib/supabase/server-client'
import { requireWorkspacePermission } from '@/lib/supabase/workspace-auth'

export async function GET() {
  try {
    const actor = await requireWorkspacePermission('dashboard', 'view')
    const [{ data: members, error: membersError }, { count: messages, error: messagesError }] = await Promise.all([
      actor.supabase.from('team_members').select('id,full_name,role_name,xp,level,status').eq('status', 'active').order('xp', { ascending: false }).limit(5),
      actor.supabase.from('public_contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    ])
    if (membersError || messagesError) throw new AdminApiError('Não foi possível carregar o resumo do dashboard.', 503)
    return NextResponse.json({ metrics: { team: members?.length ?? 0, messages: messages ?? 0 }, ranking: members ?? [] }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    if (error instanceof AdminApiError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Dashboard overview failed:', error)
    return NextResponse.json({ error: 'Não foi possível carregar o resumo do dashboard.' }, { status: 500 })
  }
}
