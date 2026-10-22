import { DashboardShell } from '@/components/dashboard-shell'
import { ProjectWorkspace } from '@/components/project-workspace'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DashboardShell initialSection="Projetos" page={<ProjectWorkspace projectId={id} />} />
}
