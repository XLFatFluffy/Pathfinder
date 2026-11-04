create table public.campaign_player_notes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  content text not null default '' check (length(content) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, user_id, id)
);

create index campaign_player_notes_owner
on public.campaign_player_notes (campaign_id, user_id, updated_at desc);

alter table public.campaign_player_notes enable row level security;

create policy campaign_player_notes_owner_read
on public.campaign_player_notes for select
to authenticated
using (
  user_id = (select auth.uid())
  and public.is_campaign_member(campaign_id)
  and exists (
    select 1
    from public.campaign_members as member
    where member.campaign_id = campaign_player_notes.campaign_id
      and member.user_id = (select auth.uid())
      and member.role = 'player'
  )
);

create policy campaign_player_notes_owner_insert
on public.campaign_player_notes for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and public.is_campaign_member(campaign_id)
  and exists (
    select 1
    from public.campaign_members as member
    where member.campaign_id = campaign_player_notes.campaign_id
      and member.user_id = (select auth.uid())
      and member.role = 'player'
  )
);

create policy campaign_player_notes_owner_update
on public.campaign_player_notes for update
to authenticated
using (
  user_id = (select auth.uid())
  and public.is_campaign_member(campaign_id)
  and exists (
    select 1
    from public.campaign_members as member
    where member.campaign_id = campaign_player_notes.campaign_id
      and member.user_id = (select auth.uid())
      and member.role = 'player'
  )
)
with check (
  user_id = (select auth.uid())
  and public.is_campaign_member(campaign_id)
  and exists (
    select 1
    from public.campaign_members as member
    where member.campaign_id = campaign_player_notes.campaign_id
      and member.user_id = (select auth.uid())
      and member.role = 'player'
  )
);

create policy campaign_player_notes_owner_delete
on public.campaign_player_notes for delete
to authenticated
using (
  user_id = (select auth.uid())
  and public.is_campaign_member(campaign_id)
  and exists (
    select 1
    from public.campaign_members as member
    where member.campaign_id = campaign_player_notes.campaign_id
      and member.user_id = (select auth.uid())
      and member.role = 'player'
  )
);

revoke all on public.campaign_player_notes from anon, authenticated;
grant select, insert, update, delete on public.campaign_player_notes to authenticated;
