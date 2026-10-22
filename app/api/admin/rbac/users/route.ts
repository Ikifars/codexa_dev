import { NextResponse } from 'next/server'
import { AdminApiError } from '@/lib/supabase/server-client'
import { getWorkspacePermissions, requireWorkspacePermission } from '@/lib/supabase/workspace-auth'

function fail(error: unknown) {
  if (error instanceof AdminApiError) return NextResponse.json({ error: error.message }, { status: error.status })
  console.error('Team administration failed:', error)
  return NextResponse.json({ error: 'Não foi possível concluir a operação de equipe.' }, { status: 500 })
}

export async function GET() {
  try {
    const { supabase } = await requireWorkspacePermission('users', 'manage_users')
    const [{ data: members, error: membersError }, { data: roles, error: rolesError }] = await Promise.all([
      supabase.from('team_members')
        .select('id,user_id,full_name,email,role_name,status,created_at,updated_at')
        .order('full_name')
        .limit(2000),
      supabase.from('access_roles').select('name,is_active').eq('is_active', true).order('name'),
    ])
    if (membersError || rolesError) {
      console.error('Team list load failed:', membersError?.message ?? rolesError?.message)
      return NextResponse.json({ error: 'Não foi possível carregar usuários e cargos.' }, { status: 503 })
    }
    return NextResponse.json({ members: members ?? [], roles: roles ?? [] }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return fail(error)
  }
}

export async function POST(request: Request) {
  let body: { email?: unknown; fullName?: unknown; roleName?: unknown }
  try {
    body = await request.json() as { email?: unknown; fullName?: unknown; roleName?: unknown }
  } catch {
    return NextResponse.json({ error: 'Corpo da solicitação inválido.' }, { status: 400 })
  }
  if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
    || typeof body.fullName !== 'string' || body.fullName.trim().length < 2 || body.fullName.trim().length > 200
    || typeof body.roleName !== 'string') {
    return NextResponse.json({ error: 'Nome, e-mail ou cargo inválido.' }, { status: 400 })
  }

  try {
    const actor = await requireWorkspacePermission('users', 'manage_users')
    const email = body.email.trim().toLowerCase()
    const { data: role, error: roleError } = await actor.supabase
      .from('access_roles').select('id,name,is_active').eq('name', body.roleName).maybeSingle()
    if (roleError) throw roleError
    if (!role || !role.is_active) return NextResponse.json({ error: 'O cargo selecionado está inativo ou não existe.' }, { status: 400 })
    const actorPermissions = await getWorkspacePermissions(actor)
    if (role.name.toLowerCase() === 'admin' && !actorPermissions.has('*')) {
      return NextResponse.json({ error: 'Seu cargo não permite convidar administradores.' }, { status: 403 })
    }
    if (role.name.toLowerCase() !== 'admin' && !actorPermissions.has('*')) {
      const { data: grants, error: grantsError } = await actor.supabase
        .from('role_permissions').select('permission_id').eq('role_id', role.id)
      if (grantsError) throw grantsError
      const ids = (grants ?? []).map((grant) => grant.permission_id)
      const { data: permissions, error: permissionsError } = ids.length
        ? await actor.supabase.from('access_permissions').select('module_name,action_name').in('id', ids)
        : { data: [], error: null }
      if (permissionsError) throw permissionsError
      if ((permissions ?? []).some((permission) => !actorPermissions.has(`${permission.module_name}:${permission.action_name}`))) {
        return NextResponse.json({ error: 'Não é possível convidar um usuário com privilégios superiores aos seus.' }, { status: 403 })
      }
    }

    const { data: existingMembers, error: existingError } = await actor.supabase
      .from('team_members').select('id').eq('email', email).limit(1)
    if (existingError) throw existingError
    if (existingMembers?.length) return NextResponse.json({ error: 'Já existe um cadastro da equipe para este e-mail.' }, { status: 409 })

    const { data: invitation, error: inviteError } = await actor.supabase.auth.admin.inviteUserByEmail(email)
    if (inviteError || !invitation.user) {
      console.error('Team invitation failed:', inviteError?.message ?? 'Invitation returned no user')
      return NextResponse.json({ error: 'O convite não foi enviado. Verifique a configuração de e-mail do Supabase.' }, { status: 502 })
    }
    const { data: member, error: memberError } = await actor.supabase.from('team_members').insert({
      id: crypto.randomUUID(),
      user_id: invitation.user.id,
      full_name: body.fullName.trim(),
      email,
      role_name: role.name,
      status: 'Ativo',
      joined_on: new Date().toISOString().slice(0, 10),
    }).select('id,user_id,full_name,email,role_name,status,created_at,updated_at').single()
    if (memberError || !member) {
      console.error('Team invitation membership creation failed:', memberError?.message ?? 'Membership returned no row')
      return NextResponse.json({ error: 'O convite foi enviado, mas o vínculo de equipe não foi salvo; revise antes de reenviar.' }, { status: 503 })
    }
    const { error: auditError } = await actor.supabase.from('admin_audit_events').insert({
      actor_id: actor.actorId,
      action_name: 'team.invited',
      entity_type: 'team_member',
      entity_id: member.id,
      new_data: { role_name: role.name, status: member.status },
      result: 'success',
    })
    if (auditError) console.error('Team invitation audit failed:', auditError.message)
    return NextResponse.json({
      member,
      warning: auditError ? 'Usuário convidado, mas a auditoria não pôde ser salva.' : null,
    }, { status: 201 })
  } catch (error) {
    return fail(error)
  }
}
