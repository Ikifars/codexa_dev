
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const url = new URL(request.url)

  const code = url.searchParams.get('code')
  const nextParam = url.searchParams.get('next')

  const next =
    nextParam?.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/workspace'

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || url.origin

  const redirectUrl = new URL(next, siteUrl)

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } =
      await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const errorUrl = new URL('/login', siteUrl)
      errorUrl.searchParams.set('error', 'recovery_failed')

      return NextResponse.redirect(errorUrl)
    }
  }

  return NextResponse.redirect(redirectUrl)
}
