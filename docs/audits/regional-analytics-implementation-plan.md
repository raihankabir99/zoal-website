# ZOAL Regional Analytics — Production Implementation Plan

## Scope
Convert CMS → Admin Dashboard → Regional Analytics from manual calculated-metric entry to automatic database-backed operational analytics.

## Architecture
zoal_orders → zoal_addresses → canonical location mapping → server-side aggregation → /api/analytics/regional → existing Regional Analytics UI.

## Required Metrics
- Orders by city/region
- Revenue by city/region
- Unique customers
- AOV
- Period-over-period growth
- Shipping cost only when authoritative

## Rules
- Use real transactional order data.
- Exclude invalid/cancelled/refunded orders according to canonical existing order-status rules.
- Never hardcode or seed business metrics.
- Never estimate profit/margin without authoritative COGS/cost data.
- Preserve existing UI where possible.
- Do not drop `zoal_regional_analytics` until all repository dependencies are verified.
- Preserve authentication, RBAC and RLS.

## Current Verified State
- Regional API is protected by authentication and owner/admin RBAC.
- Backend calls `zoal_business_insights_regional` RPC.
- Existing frontend still contains manual CRUD against `zoal_regional_analytics` and must be migrated carefully to read-only calculated metrics.

## Implementation Sequence
1. Verify all repository consumers of the legacy regional table.
2. Verify RPC SQL, grants, status/date rules and aggregation correctness.
3. Implement canonical location normalization only where required.
4. Extend server aggregation with unique customers, AOV and comparison-period growth.
5. Apply server-side date/location filters.
6. Harden RPC/API security.
7. Convert existing UI to API-driven read-only analytics.
8. Deprecate manual calculated-metric CRUD and seed behavior.
9. Add only required database indexes/policies after checking existing ones.
10. Run build/type/API/database verification and regression checks.

## Production Gate
Do not approve production until real order data flows from `zoal_orders` through the regional aggregation API into the existing dashboard, security is verified, calculations are correct, and legacy manual analytics cannot overwrite calculated metrics.
