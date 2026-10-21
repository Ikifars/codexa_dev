import { notFound } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { WorkspacePageRouter } from '@/components/workspace-page-router'
import { isWorkspaceModule, workspaceLabel } from '@/lib/workspace-modules'

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params
  if (!isWorkspaceModule(module) || module === 'dashboard') notFound()
  return <DashboardShell initialSection={workspaceLabel(module)} page={<WorkspacePageRouter module={module} />} />
}
