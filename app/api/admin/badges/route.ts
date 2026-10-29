import { NextResponse } from 'next/server'
import { AdminApiError } from '@/lib/supabase/server-client'
import { requireWorkspacePermission } from '@/lib/supabase/workspace-auth'

const allowedColors = new Set(['cyan', 'violet', 'amber', 'emerald', 'rose'])
function fail(error: unknown) { if (error instanceof AdminApiError) return NextResponse.json({ error: error.message }, { status: error.status }); console.error('Badge administration failed:', error); return NextResponse.json({ error: 'Não foi possível concluir a operação de emblemas.' }, { status: 500 }) }

export async function GET() {
  try {
    const actor = await requireWorkspacePermission('badges', 'manage')
    const [{ data: badges, error: badgesError }, { data: members, error: membersError }] = await Promise.all([
      actor.supabase.from('profile_badges').select('id,name,description,color,image_path,granted_at,member_id,granted_by').is('member_id', null).order('granted_at', { ascending: false }),
      actor.supabase.from('team_members').select('id,full_name,email,role_name,xp,level,status').order('xp', { ascending: false }).limit(500),
    ])
    if (badgesError || membersError) throw new AdminApiError('Não foi possível carregar emblemas e ranking.', 503)
    const paths = [...new Set((badges ?? []).map((badge) => badge.image_path).filter(Boolean))] as string[]
    const signed = paths.length ? await actor.supabase.storage.from('private-documents').createSignedUrls(paths, 3600) : { data: [] }
    const urls = new Map((signed.data ?? []).map((item) => [item.path, item.signedUrl]))
    return NextResponse.json({ badges: (badges ?? []).map((badge) => ({ ...badge, image_url: badge.image_path ? urls.get(badge.image_path) ?? null : null })), members: members ?? [] }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return fail(error) }
}

export async function POST(request: Request) {
  try {
    const actor = await requireWorkspacePermission('badges', 'manage')
    const form = await request.formData()
    const name = String(form.get('name') ?? '').trim(); const description = String(form.get('description') ?? '').trim(); const color = String(form.get('color') ?? 'cyan')
    if (name.length < 2 || name.length > 80 || description.length > 240 || !allowedColors.has(color)) return NextResponse.json({ error: 'Nome, descrição ou cor inválidos.' }, { status: 400 })
    let imagePath: string | null = null
    const file = form.get('image')
    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Envie uma imagem de até 2 MB.' }, { status: 400 })
      imagePath = `badges/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
      const upload = await actor.supabase.storage.from('private-documents').upload(imagePath, file, { contentType: file.type, upsert: false })
      if (upload.error) throw new AdminApiError('Não foi possível armazenar a imagem do emblema.', 503)
    }
    const { data, error } = await actor.supabase.from('profile_badges').insert({ name, description, color, image_path: imagePath, granted_by: actor.memberId }).select('id,name,description,color,image_path,granted_at').single()
    if (error || !data) throw new AdminApiError('Não foi possível criar o emblema.', 503)
    return NextResponse.json({ badge: data }, { status: 201 })
  } catch (error) { return fail(error) }
}
