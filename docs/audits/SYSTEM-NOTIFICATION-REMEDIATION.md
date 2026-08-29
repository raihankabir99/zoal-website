# ZOAL CMS — System Notification Remediation Plan

## Scope

This branch prepares the System Notification hardening work without changing `main` and without applying changes to the live Supabase project.

## Verified blockers

1. Live `zoal_notifications` schema is narrower than the application notification contract.
2. Notification RLS has overlapping permissive policies.
3. INSERT authorization is broader than a server/event-authoritative design should allow.
4. UPDATE/DELETE authorization requires least-privilege review.
5. `notificationStore` currently performs optimistic mutations and suppresses some database errors.
6. Legacy notification persistence paths must be migrated to the centralized pipeline.
7. Realtime behavior requires runtime verification.

## Safe implementation order

1. Reconcile the database/application contract using an additive migration.
2. Update application types and store mapping to use one canonical representation.
3. Add explicit authorization rules after confirming the project's auth/role helper semantics.
4. Replace silent mutation failures with rollback/reconciliation and user-visible error handling.
5. Migrate legacy localStorage notification writers.
6. Remove/deprecate legacy keys only after migration verification.
7. Verify Realtime INSERT/UPDATE/DELETE with authenticated test users for customer/staff/admin/owner scopes.
8. Run a final production gate audit.

## Safety rules

- Do not drop or rename existing columns until all application references are migrated.
- Do not delete notification rows as part of the migration.
- Do not apply this migration to production automatically.
- Do not broaden RLS as a workaround for application failures.
- Do not treat frontend role filtering as a database security boundary.

## Production gate

The module is considered production-ready only when schema compatibility, RLS authorization, mutation error handling, centralized persistence, legacy-path removal, and runtime Realtime tests all pass.
