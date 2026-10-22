# Central licensing

The Codexa workspace manages licenses and module entitlements at `/workspace/licencas`. The administrator API checks the signed-in user's `team_members.role_name = 'admin'` before using the server-only Supabase credential. License keys are generated with high entropy, shown only once, stored as SHA-256 hashes, and never returned by list or update endpoints.

## Required server configuration

Set these variables in the central deployment's server environment:

- `SUPABASE_SERVICE_ROLE_KEY` (or the Supabase `SUPABASE_SECRET_KEY`): server-only credential used by protected administration and validation routes. Never use a `NEXT_PUBLIC_` prefix.
- `NEXT_PUBLIC_SUPABASE_URL` and a publishable/anon key, as already required by the application.

For each customer application using the SDK, set server-only variables:

- `LICENSE_VALIDATION_URL`: the central deployment URL ending in `/api/licenses/validate`.
- `LICENSE_KEY`: the issued license key. Do not expose it to browser code or prefix it with `NEXT_PUBLIC_`.

Apply `supabase/migrations/20261022100000_license_management.sql` to the central Supabase project before using the feature. It migrates existing plaintext license keys to hashes, adds module entitlements, and installs database-backed rate limiting. The migration is not applied automatically by this application.

## Customer application guard

Import the server-only helper from `lib/licensing/server.ts` in a Next.js server component, route handler, or server action:

```ts
import { requireLicensedModule } from '@/lib/licensing/server'

export async function GET() {
  await requireLicensedModule('billing')
  return Response.json({ enabled: true })
}
```

Use a module's `system_modules.internal_code` as its code. `hasLicensedModule` is available for conditional server rendering; `checkLicense` returns the full validation result. The SDK caches successful responses for 30 seconds by default (maximum 5 minutes), uses a fresh validation when the cache expires, and fails closed if the central service cannot be reached without a valid cached result. Do not use the server helper in client components.

The helper is a reusable source module; customer applications must include it and call it at their own protected server routes/actions. This repository does not contain those customer applications, so their enforcement is not enabled here.

## Validation endpoint

`POST /api/licenses/validate` accepts the key only in `Authorization: Bearer <license-key>`. It returns license validity and module fields `contracted`, `enabled`, `available`, and `licensed`. Invalid keys return `401`; expired/suspended/revoked licenses return `200` with `valid: false`; requests are limited to 60 per source IP per minute. Responses are not cacheable by HTTP intermediaries. Deployments must run behind a trusted reverse proxy that overwrites `x-real-ip` (or sanitizes `x-forwarded-for`) for the IP-based limit to be reliable.
