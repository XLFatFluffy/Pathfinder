create table public.campaign_sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  session_number integer not null check (session_number > 0),
  campaign_date text not null default '' check (length(campaign_date) <= 120),
  summary text not null default '' check (length(summary) <= 50000),
  player_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, id),
  unique (campaign_id, session_number)
);

create index campaign_sessions_campaign_number
on public.campaign_sessions (campaign_id, session_number desc);

create table public.campaign_session_gm_notes (
  campaign_id uuid not null,
  session_id uuid not null,
  notes text not null default '' check (length(notes) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, session_id),
  foreign key (campaign_id, session_id)
    references public.campaign_sessions(campaign_id, id)
    on delete cascade
);

alter table public.campaign_sessions enable row level security;
alter table public.campaign_session_gm_notes enable row level security;

create policy campaign_sessions_member_read
on public.campaign_sessions for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_member(campaign_id)
  )
);

create policy campaign_sessions_gm_insert
on public.campaign_sessions for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_sessions_gm_update
on public.campaign_sessions for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_sessions_gm_delete
on public.campaign_sessions for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_session_gm_notes_gm_manage
on public.campaign_session_gm_notes for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create function public.save_campaign_session(
  target_campaign_id uuid,
  target_session_id uuid,
  target_session_number integer,
  target_campaign_date text,
  target_summary text,
  target_player_visible boolean,
  target_gm_notes text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_session_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if not public.is_campaign_gm(target_campaign_id) then
    raise exception 'Only a campaign GM can manage session logs.'
      using errcode = '42501';
  end if;

  if target_session_id is null then
    insert into public.campaign_sessions (
      campaign_id,
      session_number,
      campaign_date,
      summary,
      player_visible,
      created_by
    )
    values (
      target_campaign_id,
      target_session_number,
      trim(target_campaign_date),
      trim(target_summary),
      target_player_visible,
      current_user_id
    )
    returning id into saved_session_id;
  else
    update public.campaign_sessions
    set
      session_number = target_session_number,
      campaign_date = trim(target_campaign_date),
      summary = trim(target_summary),
      player_visible = target_player_visible,
      updated_at = now()
    where campaign_id = target_campaign_id
      and id = target_session_id
    returning id into saved_session_id;

    if not found then
      raise exception 'The session was not found in this campaign.'
        using errcode = 'P0002';
    end if;
  end if;

  insert into public.campaign_session_gm_notes (
    campaign_id,
    session_id,
    notes,
    updated_at
  )
  values (
    target_campaign_id,
    saved_session_id,
    trim(target_gm_notes),
    now()
  )
  on conflict (campaign_id, session_id)
  do update set
    notes = excluded.notes,
    updated_at = now();

  return saved_session_id;
end;
$$;

revoke all on function public.save_campaign_session(
  uuid, uuid, integer, text, text, boolean, text
) from public, anon;
grant execute on function public.save_campaign_session(
  uuid, uuid, integer, text, text, boolean, text
) to authenticated;

revoke all on public.campaign_sessions,
  public.campaign_session_gm_notes from anon, authenticated;
grant select, insert, update, delete on public.campaign_sessions to authenticated;
grant select, insert, update, delete on public.campaign_session_gm_notes
to authenticated;
