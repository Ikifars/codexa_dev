import { NextResponse } from 'next/server'
import { AdminApiError } from '@/lib/supabase/server-client'
import { getWorkspaceActor } from '@/lib/supabase/workspace-auth'

function fail(error: unknown) {
  if (error instanceof AdminApiError) return NextResponse.json({ error: error.message }, { status: error.status })
  console.error('Workspace profile update failed:', error)
  return NextResponse.json({ error: 'Não foi possível atualizar seu perfil.' }, { status: 500 })
}

export async function PATCH(request: Request) {
  let body: { fullName?: unknown }
  try {
    body = await request.json() as { fullName?: unknown }
  } catch {
    return NextResponse.json({ error: 'Corpo da solicitação inválido.' }, { status: 400 })
  }

  if (typeof body.fullName !== 'string' || body.fullName.trim().length < 2 || body.fullName.trim().length > 200) {
    return NextResponse.json({ error: 'Informe um nome entre 2 e 200 caracteres.' }, { status: 400 })
  }

  try {
    const actor = await getWorkspaceActor()
    const fullName = body.fullName.trim()
    const { data: authUser, error: authLookupError } = await actor.supabase.auth.admin.getUserById(actor.actorId)
    if (authLookupError || !authUser.user) {
      console.error('Workspace profile auth lookup failed:', authLookupError?.message ?? 'User not found')
      throw new AdminApiError('Não foi possível localizar sua conta.', 503)
    }

    const previousMetadata = authUser.user.user_metadata ?? {}
    const { error: authUpdateError } = await actor.supabase.auth.admin.updateUserById(actor.actorId, {
      user_metadata: { ...previousMetadata, display_name: fullName, full_name: fullName },
    })
    if (authUpdateError) {
      console.error('Workspace profile auth update failed:', authUpdateError.message)
      throw new AdminApiError('Não foi possível atualizar os dados da conta.', 503)
    }

    const { error: memberUpdateError } = await actor.supabase.from('team_members')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', actor.memberId)
    if (memberUpdateError) {
      const { error: rollbackError } = await actor.supabase.auth.admin.updateUserById(actor.actorId, {
        user_metadata: previousMetadata,
      })
      if (rollbackError) console.error('Workspace profile auth rollback failed:', rollbackError.message)
      console.error('Workspace profile member update failed:', memberUpdateError.message)
      throw new AdminApiError('Não foi possível salvar o nome do membro da equipe.', 503)
    }

    return NextResponse.json({ fullName })
  } catch (error) {
    return fail(error)
  }
}
