create table public.campaign_locations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  parent_id uuid,
  name text not null check (length(trim(name)) between 1 and 160),
  location_type text not null default '' check (length(location_type) <= 80),
  description text not null default '' check (length(description) <= 20000),
  player_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (campaign_id, id),
  check (parent_id is null or parent_id <> id),
  constraint campaign_locations_parent_same_campaign
    foreign key (campaign_id, parent_id)
    references public.campaign_locations(campaign_id, id)
);

create index campaign_locations_campaign_parent
on public.campaign_locations (campaign_id, parent_id);

create table public.campaign_location_gm_notes (
  campaign_id uuid not null,
  location_id uuid not null,
  notes text not null check (length(notes) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, location_id),
  foreign key (campaign_id, location_id)
    references public.campaign_locations(campaign_id, id)
    on delete cascade
);

alter table public.campaign_locations enable row level security;
alter table public.campaign_location_gm_notes enable row level security;

create policy campaign_locations_member_read
on public.campaign_locations for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_member(campaign_id)
  )
);

create policy campaign_locations_gm_insert
on public.campaign_locations for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_locations_gm_update
on public.campaign_locations for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_locations_gm_delete
on public.campaign_locations for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_location_gm_notes_gm_manage
on public.campaign_location_gm_notes for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create function public.create_campaign_location(
  target_campaign_id uuid,
  target_parent_id uuid,
  target_name text,
  target_location_type text,
  target_description text,
  target_player_visible boolean,
  target_gm_notes text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_location_id uuid;
begin
  if not public.is_campaign_gm(target_campaign_id) then
    raise exception 'Only a campaign GM can create locations.'
      using errcode = '42501';
  end if;

  insert into public.campaign_locations (
    campaign_id,
    parent_id,
    name,
    location_type,
    description,
    player_visible,
    created_by
  )
  values (
    target_campaign_id,
    target_parent_id,
    trim(target_name),
    trim(target_location_type),
    trim(target_description),
    target_player_visible,
    (select auth.uid())
  )
  returning id into new_location_id;

  if length(trim(target_gm_notes)) > 0 then
    insert into public.campaign_location_gm_notes (
      campaign_id,
      location_id,
      notes
    )
    values (
      target_campaign_id,
      new_location_id,
      trim(target_gm_notes)
    );
  end if;

  return new_location_id;
end;
$$;

revoke all on function public.create_campaign_location(
  uuid, uuid, text, text, text, boolean, text
) from public, anon;
grant execute on function public.create_campaign_location(
  uuid, uuid, text, text, text, boolean, text
) to authenticated;

revoke all on public.campaign_locations,
  public.campaign_location_gm_notes from anon, authenticated;
grant select, insert, update, delete on public.campaign_locations
to authenticated;
grant select, insert, update, delete on public.campaign_location_gm_notes
to authenticated;
