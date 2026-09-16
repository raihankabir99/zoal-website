-- ZOAL: secure server-backed third-party integration registry.
-- Secrets are encrypted by the server; this table must never be queried directly by the browser.
create table if not exists public.zoal_third_party_integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  display_name text not null,
  category text not null default 'Other',
  endpoint text null,
  auth_type text not null default 'api_key',
  credential_name text not null default 'primary',
  encrypted_secret text not null,
  iv text not null,
  auth_tag text not null,
  status text not null default 'inactive' check (status in ('active','inactive','error')),
  last_error text null,
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_verified_at timestamptz null,
  rotated_at timestamptz null,
  unique(provider, credential_name)
);

alter table public.zoal_third_party_integrations enable row level security;

revoke all on public.zoal_third_party_integrations from anon, authenticated;
grant select, insert, update, delete on public.zoal_third_party_integrations to authenticated;

create policy zoal_third_party_admin_all
on public.zoal_third_party_integrations
for all
to authenticated
using (
  exists (
    select 1 from public.zoal_users u
    where u.id = auth.uid()
      and u.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1 from public.zoal_users u
    where u.id = auth.uid()
      and u.role in ('owner','admin')
  )
);

create or replace function public.zoal_touch_third_party_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists zoal_touch_third_party_updated_at on public.zoal_third_party_integrations;
create trigger zoal_touch_third_party_updated_at
before update on public.zoal_third_party_integrations
for each row execute function public.zoal_touch_third_party_updated_at();
