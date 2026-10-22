import { NextResponse } from 'next/server'
import { AdminApiError } from '@/lib/supabase/server-client'
import { requireWorkspacePermission } from '@/lib/supabase/workspace-auth'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
type MemberUpdate = { roleName?: unknown; status?: unknown }

function fail(error: unknown) {
  if (error instanceof AdminApiError) return NextResponse.json({ error: error.message }, { status: error.status })
  console.error('Team role update failed:', error)
  return NextResponse.json({ error: 'Não foi possível atualizar o usuário.' }, { status: 500 })
}

export async function PATCH(request: Request, context: { params: Promise<{ memberId: string }> }) {
  let body: MemberUpdate
  try {
    body = await request.json() as MemberUpdate
  } catch {
    return NextResponse.json({ error: 'Corpo da solicitação inválido.' }, { status: 400 })
  }
  if ((body.roleName !== undefined && (typeof body.roleName !== 'string' || !body.roleName.trim()))
    || (body.status !== undefined && (typeof body.status !== 'string' || !['Ativo', 'Inativo'].includes(body.status)))
    || (body.roleName === undefined && body.status === undefined)) {
    return NextResponse.json({ error: 'Cargo ou status inválido.' }, { status: 400 })
  }

  try {
    const actor = await requireWorkspacePermission('users', 'manage_users')
    const { memberId } = await context.params
    if (!uuidPattern.test(memberId)) return NextResponse.json({ error: 'Identificador inválido.' }, { status: 400 })
    const { data: updated, error: updateError } = await actor.supabase.rpc('update_workspace_member', {
      p_actor_id: actor.actorId,
      p_member_id: memberId,
      p_role_name: typeof body.roleName === 'string' ? body.roleName : null,
      p_status: typeof body.status === 'string' ? body.status : null,
    })
    if (updateError) {
      if (updateError.code === '42501') return NextResponse.json({ error: 'Operação não autorizada.' }, { status: 403 })
      if (updateError.code === '22023') return NextResponse.json({ error: 'Cargo ou status inválido.' }, { status: 400 })
      if (updateError.code === 'P0002') return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
      if (updateError.code === '23514') return NextResponse.json({ error: 'Não é possível desativar ou rebaixar o último administrador ativo.' }, { status: 409 })
      console.error('Atomic team member update failed:', updateError.message)
      throw new AdminApiError('Não foi possível atualizar o usuário.', 503)
    }
    if (!updated) throw new AdminApiError('O banco não confirmou a atualização do usuário.', 503)
    return NextResponse.json({ member: updated })
  } catch (error) {
    return fail(error)
  }
}
