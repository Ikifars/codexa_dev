import { DashboardShell } from '@/components/dashboard-shell'
import { AccessDenied } from '@/components/access-denied'
import { hasWorkspaceAccess } from '@/lib/workspace-access'
import { AdminApiError } from '@/lib/supabase/server-client'
import { getWorkspaceAccessSnapshot } from '@/lib/supabase/workspace-auth'

export default async function WorkspacePage() {
  try {
    const access = await getWorkspaceAccessSnapshot()
    if (!hasWorkspaceAccess(access.permissions, 'dashboard')) {
      return <DashboardShell initialSection="Dashboard" permissions={access.permissions} page={<AccessDenied />} />
    }
    return <DashboardShell permissions={access.permissions} />
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 403) {
      return <DashboardShell initialSection="Dashboard" page={<AccessDenied />} />
    }
    if (error instanceof AdminApiError && error.status === 401) return <DashboardShell />
    throw error
  }
}
