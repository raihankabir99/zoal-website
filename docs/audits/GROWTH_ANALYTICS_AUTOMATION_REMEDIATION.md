# Growth Analytics Automation Remediation

This document records the approved production remediation scope for CMS → Growth Analytics.

## Objective

Replace manual operational KPI reporting with server-side, database-backed analytics while preserving `zoal_growth_reports` as legacy historical data.

## Rules

- No deletion of legacy growth reports.
- No fake production KPI seeding.
- Revenue, orders, and registered-customer metrics must originate from authoritative transactional tables.
- Date filtering must be server-side.
- Growth percentages must be calculated from current and previous periods.
- Existing authentication/RBAC must remain enforced.
- Traffic, SEO, ads spend, marketing ROI, funnel, retention, and forecasting must remain unavailable unless authoritative source data exists.
