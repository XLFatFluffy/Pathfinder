create table public.campaign_house_relationships (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  house_id uuid not null,
  related_house_id uuid not null,
  relationship_type text not null check (
    relationship_type in (
      'allied', 'friendly', 'neutral', 'hostile', 'rival', 'enemy',
      'vassal', 'overlord', 'at_war', 'marriage_alliance', 'blood_relation'
    )
  ),
  description text not null default '' check (length(description) <= 10000),
  player_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (house_id <> related_house_id),
  unique (campaign_id, house_id, related_house_id),
  unique (campaign_id, id),
  constraint campaign_house_relationships_house_same_campaign
    foreign key (campaign_id, house_id)
    references public.campaign_houses(campaign_id, id)
    on delete cascade,
  constraint campaign_house_relationships_related_same_campaign
    foreign key (campaign_id, related_house_id)
    references public.campaign_houses(campaign_id, id)
    on delete cascade
);

create index campaign_house_relationships_related
on public.campaign_house_relationships (campaign_id, related_house_id);

create unique index campaign_house_relationships_one_per_house_pair
on public.campaign_house_relationships (
  campaign_id,
  least(house_id, related_house_id),
  greatest(house_id, related_house_id)
);

create table public.campaign_house_relationship_gm_notes (
  campaign_id uuid not null,
  relationship_id uuid not null,
  notes text not null check (length(notes) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, relationship_id),
  foreign key (campaign_id, relationship_id)
    references public.campaign_house_relationships(campaign_id, id)
    on delete cascade
);

create table public.campaign_house_relationship_history (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  relationship_id uuid not null,
  previous_type text check (
    previous_type is null
    or previous_type in (
      'allied', 'friendly', 'neutral', 'hostile', 'rival', 'enemy',
      'vassal', 'overlord', 'at_war', 'marriage_alliance', 'blood_relation'
    )
  ),
  new_type text not null check (
    new_type in (
      'allied', 'friendly', 'neutral', 'hostile', 'rival', 'enemy',
      'vassal', 'overlord', 'at_war', 'marriage_alliance', 'blood_relation'
    )
  ),
  campaign_date text check (campaign_date is null or length(campaign_date) <= 120),
  reason text not null default '' check (length(reason) <= 4000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (campaign_id, relationship_id)
    references public.campaign_house_relationships(campaign_id, id)
    on delete cascade
);

create index campaign_house_relationship_history_recorded
on public.campaign_house_relationship_history
  (campaign_id, relationship_id, created_at desc);

alter table public.campaign_house_relationships enable row level security;
alter table public.campaign_house_relationship_gm_notes enable row level security;
alter table public.campaign_house_relationship_history enable row level security;

create policy campaign_house_relationships_member_read
on public.campaign_house_relationships for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_member(campaign_id)
    and exists (
      select 1
      from public.campaign_houses as house
      where house.campaign_id = campaign_house_relationships.campaign_id
        and house.id = campaign_house_relationships.house_id
        and house.player_visible
    )
    and exists (
      select 1
      from public.campaign_houses as related_house
      where related_house.campaign_id = campaign_house_relationships.campaign_id
        and related_house.id = campaign_house_relationships.related_house_id
        and related_house.player_visible
    )
  )
);

create policy campaign_house_relationships_gm_insert
on public.campaign_house_relationships for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_house_relationships_gm_update
on public.campaign_house_relationships for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_house_relationships_gm_delete
on public.campaign_house_relationships for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_house_relationship_gm_notes_gm_manage
on public.campaign_house_relationship_gm_notes for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_house_relationship_history_gm_read
on public.campaign_house_relationship_history for select
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_house_relationship_history_gm_insert
on public.campaign_house_relationship_history for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create function public.save_campaign_house_relationship(
  target_campaign_id uuid,
  target_relationship_id uuid,
  target_house_id uuid,
  target_related_house_id uuid,
  target_relationship_type text,
  target_description text,
  target_player_visible boolean,
  target_gm_notes text,
  target_campaign_date text,
  target_reason text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_relationship_id uuid;
  previous_relationship_type text;
  current_user_id uuid := (select auth.uid());
begin
  if not public.is_campaign_gm(target_campaign_id) then
    raise exception 'Only a campaign GM can manage house relationships.'
      using errcode = '42501';
  end if;

  if target_house_id = target_related_house_id then
    raise exception 'A house cannot have a relationship with itself.'
      using errcode = '23514';
  end if;

  if target_relationship_id is null then
    insert into public.campaign_house_relationships (
      campaign_id,
      house_id,
      related_house_id,
      relationship_type,
      description,
      player_visible,
      created_by
    )
    values (
      target_campaign_id,
      target_house_id,
      target_related_house_id,
      target_relationship_type,
      trim(target_description),
      target_player_visible,
      current_user_id
    )
    returning id into saved_relationship_id;

    insert into public.campaign_house_relationship_history (
      campaign_id,
      relationship_id,
      previous_type,
      new_type,
      campaign_date,
      reason,
      created_by
    )
    values (
      target_campaign_id,
      saved_relationship_id,
      null,
      target_relationship_type,
      nullif(trim(target_campaign_date), ''),
      trim(target_reason),
      current_user_id
    );
  else
    select relationship.relationship_type
    into previous_relationship_type
    from public.campaign_house_relationships as relationship
    where relationship.campaign_id = target_campaign_id
      and relationship.id = target_relationship_id
    for update;

    if not found then
      raise exception 'The house relationship was not found in this campaign.'
        using errcode = 'P0002';
    end if;

    update public.campaign_house_relationships
    set
      house_id = target_house_id,
      related_house_id = target_related_house_id,
      relationship_type = target_relationship_type,
      description = trim(target_description),
      player_visible = target_player_visible,
      updated_at = now()
    where campaign_id = target_campaign_id
      and id = target_relationship_id;

    saved_relationship_id := target_relationship_id;

    if previous_relationship_type is distinct from target_relationship_type then
      insert into public.campaign_house_relationship_history (
        campaign_id,
        relationship_id,
        previous_type,
        new_type,
        campaign_date,
        reason,
        created_by
      )
      values (
        target_campaign_id,
        saved_relationship_id,
        previous_relationship_type,
        target_relationship_type,
        nullif(trim(target_campaign_date), ''),
        trim(target_reason),
        current_user_id
      );
    end if;
  end if;

  if length(trim(target_gm_notes)) > 0 then
    insert into public.campaign_house_relationship_gm_notes (
      campaign_id,
      relationship_id,
      notes
    )
    values (target_campaign_id, saved_relationship_id, trim(target_gm_notes))
    on conflict (campaign_id, relationship_id)
    do update set notes = excluded.notes, updated_at = now();
  else
    delete from public.campaign_house_relationship_gm_notes
    where campaign_id = target_campaign_id
      and relationship_id = saved_relationship_id;
  end if;

  return saved_relationship_id;
end;
$$;

revoke all on function public.save_campaign_house_relationship(
  uuid, uuid, uuid, uuid, text, text, boolean, text, text, text
) from public, anon;
grant execute on function public.save_campaign_house_relationship(
  uuid, uuid, uuid, uuid, text, text, boolean, text, text, text
) to authenticated;

revoke all on public.campaign_house_relationships,
  public.campaign_house_relationship_gm_notes,
  public.campaign_house_relationship_history from anon, authenticated;
grant select, insert, update, delete on public.campaign_house_relationships
to authenticated;
grant select, insert, update, delete on public.campaign_house_relationship_gm_notes
to authenticated;
grant select, insert on public.campaign_house_relationship_history
to authenticated;
