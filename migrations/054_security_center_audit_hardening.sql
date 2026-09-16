-- ZOAL Security Center targeted hardening
-- Safe scope: canonical audit ledger and security helper functions only.
-- Service-role backend operations continue to work because service_role bypasses RLS.

-- Canonical audit events must be server-authoritative. Remove the broad public INSERT policy.
drop policy if exists zoal_activity_logs_insert on public.zoal_activity_logs;

-- Defense-in-depth: anonymous clients must not directly execute privileged role helpers.
revoke execute on function public.get_auth_user_role() from anon;
revoke execute on function public.is_admin_or_owner() from anon;
revoke execute on function public.is_privileged_role() from anon;
revoke execute on function public.is_support_staff_role() from anon;

-- Pin SECURITY DEFINER search_path to prevent search_path hijacking.
alter function public.get_auth_user_role() set search_path = public;
alter function public.is_admin_or_owner() set search_path = public;
alter function public.is_privileged_role() set search_path = public;
alter function public.is_support_staff_role() set search_path = public;
