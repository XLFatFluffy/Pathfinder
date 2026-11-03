create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  created_at timestamptz not null default now()
);

create table public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('gm', 'player')),
  created_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create table public.campaign_journal_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  content text not null default '' check (length(content) <= 50000),
  campaign_date text check (campaign_date is null or length(campaign_date) <= 120),
  player_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.campaigns (id, name)
values ('00000000-0000-4000-8000-000000000001', 'Pathfinder Campaign');

create function public.is_campaign_member(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaign_members as member
    where member.campaign_id = target_campaign_id
      and member.user_id = (select auth.uid())
  );
$$;

create function public.is_campaign_gm(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaign_members as member
    where member.campaign_id = target_campaign_id
      and member.user_id = (select auth.uid())
      and member.role = 'gm'
  );
$$;

revoke all on function public.is_campaign_member(uuid) from public, anon;
revoke all on function public.is_campaign_gm(uuid) from public, anon;
grant execute on function public.is_campaign_member(uuid) to authenticated;
grant execute on function public.is_campaign_gm(uuid) to authenticated;

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.campaign_journal_entries enable row level security;

create policy campaigns_member_read
on public.campaigns for select
to authenticated
using (public.is_campaign_member(id));

create policy campaign_members_read
on public.campaign_members for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_campaign_gm(campaign_id)
);

create policy campaign_journal_member_read
on public.campaign_journal_entries for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_member(campaign_id)
  )
);

create policy campaign_journal_gm_manage
on public.campaign_journal_entries for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

revoke all on public.campaigns, public.campaign_members,
  public.campaign_journal_entries from anon, authenticated;
grant select on public.campaigns, public.campaign_members
to authenticated;
grant select, insert, update, delete on public.campaign_journal_entries
to authenticated;
