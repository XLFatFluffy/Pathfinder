alter table public.campaign_maps
drop constraint campaign_maps_check;

alter table public.campaign_maps
add constraint campaign_maps_artwork_path_check
check (
  artwork_path is null
  or artwork_path = campaign_id::text || '/' || id::text || '/artwork'
  or artwork_path ~* (
    '^' || campaign_id::text || '/' || id::text
    || '/artwork-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-'
    || '[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  )
);

create or replace function public.can_manage_campaign_map_artwork(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  path_parts text[];
begin
  path_parts := string_to_array(object_name, '/');
  if cardinality(path_parts) <> 3
    or path_parts[3] !~* (
      '^artwork(-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-'
      || '[89ab][0-9a-f]{3}-[0-9a-f]{12})?$'
    )
    or path_parts[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or path_parts[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return false;
  end if;

  return exists (
    select 1
    from public.campaign_maps as campaign_map
    where campaign_map.campaign_id = path_parts[1]::uuid
      and campaign_map.id = path_parts[2]::uuid
      and public.is_campaign_gm(campaign_map.campaign_id)
  );
end;
$$;

create or replace function public.can_read_campaign_map_artwork(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  path_parts text[];
begin
  path_parts := string_to_array(object_name, '/');
  if cardinality(path_parts) <> 3
    or path_parts[3] !~* (
      '^artwork(-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-'
      || '[89ab][0-9a-f]{3}-[0-9a-f]{12})?$'
    )
    or path_parts[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or path_parts[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return false;
  end if;

  return exists (
    select 1
    from public.campaign_maps as campaign_map
    where campaign_map.campaign_id = path_parts[1]::uuid
      and campaign_map.id = path_parts[2]::uuid
      and campaign_map.artwork_path = object_name
      and (
        public.is_campaign_gm(campaign_map.campaign_id)
        or (
          campaign_map.player_visible
          and public.is_campaign_member(campaign_map.campaign_id)
        )
      )
  );
end;
$$;
