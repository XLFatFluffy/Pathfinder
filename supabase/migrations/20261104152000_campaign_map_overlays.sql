create function public.is_valid_campaign_map_overlay_points(
  overlay_type text,
  points jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  point jsonb;
  point_count integer := 0;
  required_count integer;
begin
  if overlay_type is null
    or overlay_type not in ('region', 'route')
    or jsonb_typeof(points) is distinct from 'array'
  then
    return false;
  end if;

  required_count := case when overlay_type = 'region' then 3 else 2 end;
  point_count := jsonb_array_length(points);
  if point_count < required_count or point_count > 1000 then
    return false;
  end if;

  point_count := 0;
  for point in select value from jsonb_array_elements(points)
  loop
    if jsonb_typeof(point) is distinct from 'object'
      or jsonb_typeof(point -> 'x') is distinct from 'number'
      or jsonb_typeof(point -> 'y') is distinct from 'number'
    then
      return false;
    end if;

    if (point ->> 'x')::numeric not between 0 and 1
      or (point ->> 'y')::numeric not between 0 and 1
    then
      return false;
    end if;

    point_count := point_count + 1;
  end loop;

  return point_count between required_count and 1000;
exception
  when invalid_text_representation or numeric_value_out_of_range then
    return false;
end;
$$;

revoke all on function public.is_valid_campaign_map_overlay_points(text, jsonb)
from public, anon, authenticated;
grant execute on function public.is_valid_campaign_map_overlay_points(text, jsonb)
to authenticated;

create table public.campaign_map_overlays (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  map_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 160),
  overlay_type text not null check (overlay_type in ('region', 'route')),
  points jsonb not null,
  color text not null default '#e6b45e'
    check (color ~ '^#[0-9a-fA-F]{6}$'),
  player_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_map_overlays_valid_points
    check (
      public.is_valid_campaign_map_overlay_points(overlay_type, points)
    ),
  constraint campaign_map_overlays_map_same_campaign
    foreign key (campaign_id, map_id)
    references public.campaign_maps(campaign_id, id)
    on delete cascade
);

create index campaign_map_overlays_map
on public.campaign_map_overlays (campaign_id, map_id);

alter table public.campaign_map_overlays enable row level security;

create policy campaign_map_overlays_member_read
on public.campaign_map_overlays for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_member(campaign_id)
    and exists (
      select 1
      from public.campaign_maps as campaign_map
      where campaign_map.id = campaign_map_overlays.map_id
        and campaign_map.campaign_id = campaign_map_overlays.campaign_id
        and campaign_map.player_visible
    )
  )
);

create policy campaign_map_overlays_gm_insert
on public.campaign_map_overlays for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_map_overlays_gm_update
on public.campaign_map_overlays for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_map_overlays_gm_delete
on public.campaign_map_overlays for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

revoke all on public.campaign_map_overlays from anon, authenticated;
grant select, insert, update, delete on public.campaign_map_overlays
to authenticated;
