-- Company KPI Center security hardening
-- Keep KPI aggregation RPCs server-only; browser roles must use authorized API routes.
revoke execute on function public.zoal_business_insights_core_stats(timestamptz, timestamptz) from anon, authenticated;
revoke execute on function public.zoal_business_insights_regional(timestamptz, timestamptz) from anon, authenticated;
grant execute on function public.zoal_business_insights_core_stats(timestamptz, timestamptz) to service_role;
grant execute on function public.zoal_business_insights_regional(timestamptz, timestamptz) to service_role;
