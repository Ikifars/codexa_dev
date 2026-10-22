import 'server-only'

import { createLicenseGuard } from './license-guard'

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
