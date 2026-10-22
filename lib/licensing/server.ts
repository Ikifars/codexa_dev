import 'server-only'

import {
  createLicenseGuard,
  LicenseServiceUnavailableError,
  LicensedModuleRequiredError,
} from './license-guard'

let guard: ReturnType<typeof createLicenseGuard> | undefined

function getGuard() {
  if (!guard) {
    guard = createLicenseGuard({
      endpoint: process.env.LICENSE_VALIDATION_URL ?? '',
      licenseKey: process.env.LICENSE_KEY ?? '',
    })
  }
  return guard
}

export const checkLicense = () => getGuard().check()
export const hasLicensedModule = (moduleCode: string) => getGuard().hasModule(moduleCode)
export const requireLicensedModule = (moduleCode: string) => getGuard().requireModule(moduleCode)

export function withLicensedModule<Args extends unknown[]>(
  moduleCode: string,
  handler: (...args: Args) => Response | Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      await requireLicensedModule(moduleCode)
    } catch (error) {
      if (error instanceof LicensedModuleRequiredError) {
        return Response.json(
          { error: `O módulo "${moduleCode}" não está liberado nesta licença.` },
          { status: 403, headers: { 'Cache-Control': 'no-store' } },
        )
      }
      if (error instanceof LicenseServiceUnavailableError) {
        return Response.json(
          { error: 'Não foi possível validar a licença agora.' },
          { status: 503, headers: { 'Cache-Control': 'no-store' } },
        )
      }
      throw error
    }

    return handler(...args)
  }
}
