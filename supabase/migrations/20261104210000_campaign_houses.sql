create table public.campaign_houses (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  heraldry_description text not null default '' check (length(heraldry_description) <= 2000),
  motto text not null default '' check (length(motto) <= 500),
  description text not null default '' check (length(description) <= 20000),
  player_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, id)
);

create index campaign_houses_campaign_name
on public.campaign_houses (campaign_id, name);

create table public.campaign_house_gm_details (
  campaign_id uuid not null,
  house_id uuid not null,
  founding_history text not null default '' check (length(founding_history) <= 20000),
  current_ruler_id uuid,
  ancestral_seat_location_id uuid,
  holdings text not null default '' check (length(holdings) <= 10000),
  succession text not null default '' check (length(succession) <= 10000),
  military_strength text not null default '' check (length(military_strength) <= 4000),
  wealth text not null default '' check (length(wealth) <= 4000),
  resources text not null default '' check (length(resources) <= 10000),
  political_influence text not null default '' check (length(political_influence) <= 4000),
  religious_affiliations text not null default '' check (length(religious_affiliations) <= 4000),
  objectives text not null default '' check (length(objectives) <= 10000),
  secrets text not null default '' check (length(secrets) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, house_id),
  constraint campaign_house_gm_details_house_same_campaign
    foreign key (campaign_id, house_id)
    references public.campaign_houses(campaign_id, id)
    on delete cascade,
  constraint campaign_house_gm_details_ruler_same_campaign
    foreign key (campaign_id, current_ruler_id)
    references public.campaign_npcs(campaign_id, id),
  constraint campaign_house_gm_details_seat_same_campaign
    foreign key (campaign_id, ancestral_seat_location_id)
    references public.campaign_locations(campaign_id, id)
);

alter table public.campaign_houses enable row level security;
alter table public.campaign_house_gm_details enable row level security;

create policy campaign_houses_member_read
on public.campaign_houses for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_member(campaign_id)
  )
);

create policy campaign_houses_gm_insert
on public.campaign_houses for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_houses_gm_update
on public.campaign_houses for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_houses_gm_delete
on public.campaign_houses for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_house_gm_details_gm_manage
on public.campaign_house_gm_details for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create function public.save_campaign_house(
  target_campaign_id uuid,
  target_house_id uuid,
  target_name text,
  target_heraldry_description text,
  target_motto text,
  target_description text,
  target_player_visible boolean,
  target_founding_history text,
  target_current_ruler_id uuid,
  target_ancestral_seat_location_id uuid,
  target_holdings text,
  target_succession text,
  target_military_strength text,
  target_wealth text,
  target_resources text,
  target_political_influence text,
  target_religious_affiliations text,
  target_objectives text,
  target_secrets text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_house_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if not public.is_campaign_gm(target_campaign_id) then
    raise exception 'Only a campaign GM can manage noble houses.'
      using errcode = '42501';
  end if;

  if target_house_id is null then
    insert into public.campaign_houses (
      campaign_id,
      name,
      heraldry_description,
      motto,
      description,
      player_visible,
      created_by
    )
    values (
      target_campaign_id,
      trim(target_name),
      trim(target_heraldry_description),
      trim(target_motto),
      trim(target_description),
      target_player_visible,
      current_user_id
    )
    returning id into saved_house_id;
  else
    update public.campaign_houses
    set
      name = trim(target_name),
      heraldry_description = trim(target_heraldry_description),
      motto = trim(target_motto),
      description = trim(target_description),
      player_visible = target_player_visible,
      updated_at = now()
    where campaign_id = target_campaign_id
      and id = target_house_id
    returning id into saved_house_id;

    if not found then
      raise exception 'The noble house was not found in this campaign.'
        using errcode = 'P0002';
    end if;
  end if;

  insert into public.campaign_house_gm_details (
    campaign_id,
    house_id,
    founding_history,
    current_ruler_id,
    ancestral_seat_location_id,
    holdings,
    succession,
    military_strength,
    wealth,
    resources,
    political_influence,
    religious_affiliations,
    objectives,
    secrets,
    updated_at
  )
  values (
    target_campaign_id,
    saved_house_id,
    trim(target_founding_history),
    target_current_ruler_id,
    target_ancestral_seat_location_id,
    trim(target_holdings),
    trim(target_succession),
    trim(target_military_strength),
    trim(target_wealth),
    trim(target_resources),
    trim(target_political_influence),
    trim(target_religious_affiliations),
    trim(target_objectives),
    trim(target_secrets),
    now()
  )
  on conflict (campaign_id, house_id)
  do update set
    founding_history = excluded.founding_history,
    current_ruler_id = excluded.current_ruler_id,
    ancestral_seat_location_id = excluded.ancestral_seat_location_id,
    holdings = excluded.holdings,
    succession = excluded.succession,
    military_strength = excluded.military_strength,
    wealth = excluded.wealth,
    resources = excluded.resources,
    political_influence = excluded.political_influence,
    religious_affiliations = excluded.religious_affiliations,
    objectives = excluded.objectives,
    secrets = excluded.secrets,
    updated_at = now();

  return saved_house_id;
end;
$$;

revoke all on function public.save_campaign_house(
  uuid, uuid, text, text, text, text, boolean, text, uuid, uuid, text, text,
  text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.save_campaign_house(
  uuid, uuid, text, text, text, text, boolean, text, uuid, uuid, text, text,
  text, text, text, text, text, text, text
) to authenticated;

revoke all on public.campaign_houses,
  public.campaign_house_gm_details from anon, authenticated;
grant select, insert, update, delete on public.campaign_houses to authenticated;
grant select, insert, update, delete on public.campaign_house_gm_details to authenticated;
