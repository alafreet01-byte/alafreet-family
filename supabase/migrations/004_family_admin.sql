-- ALAFREET V10 BUILD 001 - Family Admin

alter table public.family_members
add column if not exists username text unique;

create index if not exists family_members_username_idx
on public.family_members(username);

create table if not exists public.account_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_member_id text references public.family_members(id) on delete set null,
  target_member_id text references public.family_members(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.account_audit_log enable row level security;

drop policy if exists "super admin reads account audit" on public.account_audit_log;
create policy "super admin reads account audit"
on public.account_audit_log
for select
to authenticated
using (
  exists (
    select 1
    from public.family_members
    where auth_user_id = auth.uid()
      and role = 'super_admin'
  )
);

grant select, insert, update on public.family_members to authenticated;
grant select, insert on public.account_audit_log to authenticated;
grant all on public.family_members to service_role;
grant all on public.account_audit_log to service_role;
grant all on public.core_events to service_role;

