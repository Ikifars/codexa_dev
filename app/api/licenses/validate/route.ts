import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { isModuleAvailable } from '@/lib/licensing/module-status'
import { createServiceClient } from '@/lib/supabase/admin-server'

export const runtime = 'nodejs'

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization')
  const match = authorization?.match(/^Bearer\s+([\x21-\x7E]{16,256})$/)
  if (!match) return json({ valid: false, reason: 'invalid_key', expiresAt: null, modules: [] }, 401)

  const forwardedIp = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ipHash = createHash('sha256').update(forwardedIp).digest('hex')

  let supabase
  try {
    supabase = createServiceClient()
  } catch (error) {
    console.error('License validation is not configured:', error instanceof Error ? error.message : error)
    return json({ error: 'Serviço de validação indisponível.' }, 503)
  }

  const { data: withinLimit, error: rateLimitError } = await supabase.rpc('consume_license_validation_rate_limit', {
    p_key_hash: ipHash,
    p_limit: 60,
  })
  if (rateLimitError) {
    console.error('License validation rate limit failed:', rateLimitError.message)
    return json({ error: 'Serviço de validação indisponível.' }, 503)
  }
  if (!withinLimit) return json({ error: 'Limite de validações excedido.' }, 429)

  const keyHash = createHash('sha256').update(match[1]).digest('hex')
  const { data: license, error: licenseError } = await supabase
    .from('licenses')
    .select('id,system_id,status,expires_at')
    .eq('license_key_hash', keyHash)
    .maybeSingle()
  if (licenseError) {
    console.error('License validation lookup failed:', licenseError.message)
    return json({ error: 'Serviço de validação indisponível.' }, 503)
  }
  if (!license) return json({ valid: false, reason: 'invalid_key', expiresAt: null, modules: [] }, 401)

  const normalizedStatus = typeof license.status === 'string' ? license.status.trim().toLowerCase() : ''
  const active = normalizedStatus === 'active' || normalizedStatus === 'ativa'
  const expired = license.expires_at !== null && new Date(license.expires_at).getTime() <= Date.now()
  if (!active || expired) {
    return json({
      valid: false,
      reason: expired ? 'expired' : 'inactive',
      expiresAt: license.expires_at,
      modules: [],
    })
  }

  const [{ data: modules, error: modulesError }, { data: entitlements, error: entitlementsError }] = await Promise.all([
    supabase.from('system_modules').select('id,name,internal_code,availability_status')
      .or(`system_id.eq.${license.system_id},system_id.is.null`),
    supabase.from('license_module_entitlements').select('system_module_id,is_contracted,is_enabled').eq('license_id', license.id),
  ])
  if (modulesError || entitlementsError) {
    console.error('License module validation failed:', modulesError?.message ?? entitlementsError?.message)
    return json({ error: 'Serviço de validação indisponível.' }, 503)
  }

  const entitlementByModule = new Map((entitlements ?? []).map((item) => [item.system_module_id, item]))
  return json({
    valid: true,
    reason: null,
    expiresAt: license.expires_at,
    modules: (modules ?? []).map((module) => {
      const entitlement = entitlementByModule.get(module.id)
      const available = isModuleAvailable(module.availability_status)
      const contracted = entitlement?.is_contracted ?? false
      const enabled = entitlement?.is_enabled ?? false
      return {
        code: module.internal_code,
        name: module.name,
        contracted,
        enabled,
        available,
        licensed: contracted && enabled && available,
      }
    }),
  })
}
