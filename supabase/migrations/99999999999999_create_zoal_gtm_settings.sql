-- ZOAL: minimal production Google Tag Manager configuration.
-- Only non-secret GTM container configuration is stored here.
create table if not exists public.zoal_gtm_settings (
  id uuid primary key default gen_random_uuid(),
  container_id text not null check (container_id ~ '^GTM-[A-Z0-9]{5,10}$'),
  environment text not null default 'Production' check (environment in ('Production','Staging','Development')),
  enabled boolean not null default false,
  consent_required boolean not null default true,
  description text not null default '',
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists zoal_gtm_settings_singleton_idx on public.zoal_gtm_settings ((true));

alter table public.zoal_gtm_settings enable row level security;

revoke all on public.zoal_gtm_settings from anon, authenticated;

create or replace function public.zoal_gtm_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists zoal_gtm_settings_updated_at on public.zoal_gtm_settings;
create trigger zoal_gtm_settings_updated_at
before update on public.zoal_gtm_settings
for each row execute function public.zoal_gtm_settings_updated_at();
