# Workspace access control

The workspace uses `team_members.role_name` as each member's primary role and the existing `access_roles`, `access_permissions`, and `role_permissions` tables as its permission catalog. Role matching ignores surrounding whitespace and letter case, and permission grants are read through the resolved role ID so legacy name formatting cannot silently remove a member's access. Access is denied when there is no active member, no active role, or no explicit permission. The `admin` role is the only built-in full-access role.

## Applying the database changes

Apply these migrations to a non-production Supabase project first, in timestamp order:

1. `supabase/migrations/20261021220000_project_collaboration.sql`
2. `supabase/migrations/20261022100000_license_management.sql`
3. `supabase/migrations/20261022120000_workspace_rbac.sql`

The RBAC migration seeds the standard roles and permission catalog, installs table and Storage RLS policies, protects the built-in administrator role and audit logs, and creates transactional RPCs used by role and member administration. It must be reviewed against the target project's existing policies and schema before deployment. The existing policies in the connected Supabase project have not been independently enumerated, and the migration has not been applied or exercised against that database.

## Server configuration

Protected APIs validate the signed-in Supabase user and active team membership before using the server-only `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`). Never expose either key to browser code. Role edits and member role/status changes execute through database RPCs so the database update and audit event are committed or rolled back together.

Admins with `users:manage_users` can create a confirmed account and team membership from the Users panel by setting an initial password, or link an existing Supabase account by leaving the password blank. An existing unlinked team record with the same email is linked instead of duplicated. The panel also supports editing a member's name and email; email changes are synchronized with Supabase Auth. Share initial passwords with users through a secure channel. Account creation, profile changes, role changes, and status changes are audited.

## Verification limits

Run the route-to-permission unit tests with `node --test tests/rbac/workspace-access.test.mjs`. They do not replace database tests: before production, apply the migrations in a staging project and test each role's allowed and denied reads/writes, row ownership boundaries, Storage access, administrator protection, and audit immutability with separate authenticated accounts. Do not treat the migration as verified until those checks pass.
