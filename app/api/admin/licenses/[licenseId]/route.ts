import { NextResponse } from 'next/server'
import { AdminApiError, requireWorkspacePermission } from '@/lib/supabase/admin-server'

type LicenseUpdate = { status?: unknown; expiresAt?: unknown }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const licenseStatuses = new Set(['active', 'suspended', 'revoked'])

function responseError(error: unknown) {
  if (error instanceof AdminApiError) return NextResponse.json({ error: error.message }, { status: error.status })
  console.error('License update failed:', error)
  return NextResponse.json({ error: 'Não foi possível atualizar a licença.' }, { status: 500 })
}

export async function PATCH(request: Request, context: { params: Promise<{ licenseId: string }> }) {
  let body: LicenseUpdate
  try {
    body = await request.json() as LicenseUpdate
  } catch {
    return NextResponse.json({ error: 'Corpo da solicitação inválido.' }, { status: 400 })
  }

  const changes: Record<string, string | null> = {}
  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !licenseStatuses.has(body.status)) {
      return NextResponse.json({ error: 'Status de licença inválido.' }, { status: 400 })
    }
    changes.status = body.status
  }
  if (body.expiresAt !== undefined) {
    if (body.expiresAt === null || body.expiresAt === '') changes.expires_at = null
    else if (typeof body.expiresAt === 'string') {
      const expiration = /^\d{4}-\d{2}-\d{2}$/.test(body.expiresAt)
        ? new Date(`${body.expiresAt}T23:59:59.999Z`)
        : new Date(body.expiresAt)
      if (Number.isNaN(expiration.getTime())) return NextResponse.json({ error: 'Data de expiração inválida.' }, { status: 400 })
      changes.expires_at = expiration.toISOString()
    } else return NextResponse.json({ error: 'Data de expiração inválida.' }, { status: 400 })
  }
  if (!Object.keys(changes).length) return NextResponse.json({ error: 'Nenhuma alteração informada.' }, { status: 400 })

  try {
    const { params } = context
    const { licenseId } = await params
    if (!uuidPattern.test(licenseId)) return NextResponse.json({ error: 'Identificador de licença inválido.' }, { status: 400 })
    const { actorId, supabase } = await requireWorkspacePermission('licenses', 'manage_licenses')
    const { data: license, error: updateError } = await supabase
      .from('licenses')
      .update(changes)
      .eq('id', licenseId)
      .select('id,status,expires_at')
      .maybeSingle()
    if (updateError) return responseError(updateError)
    if (!license) return NextResponse.json({ error: 'Licença não encontrada.' }, { status: 404 })

    const { error: auditError } = await supabase.from('admin_audit_events').insert({
      actor_id: actorId,
      action_name: 'license.updated',
      entity_type: 'license',
      entity_id: license.id,
      result: 'success',
    })
    if (auditError) console.error('License update audit write failed:', auditError.message)

    return NextResponse.json({
      license,
      warning: auditError ? 'Licença atualizada, mas o evento de auditoria não foi salvo.' : null,
    })
  } catch (error) {
    return responseError(error)
  }
}
