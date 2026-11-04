create function public.update_campaign_location(
  target_campaign_id uuid,
  target_location_id uuid,
  target_parent_id uuid,
  target_name text,
  target_location_type text,
  target_description text,
  target_player_visible boolean,
  target_gm_notes text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_parent_is_descendant boolean;
begin
  if not public.is_campaign_gm(target_campaign_id) then
    raise exception 'Only a campaign GM can update locations.'
      using errcode = '42501';
  end if;

  if target_parent_id is not null then
    with recursive descendants(id) as (
      select id
      from public.campaign_locations
      where campaign_id = target_campaign_id
        and parent_id = target_location_id
      union
      select child.id
      from public.campaign_locations as child
      join descendants on child.parent_id = descendants.id
      where child.campaign_id = target_campaign_id
    )
    select exists (
      select 1
      from descendants
      where id = target_parent_id
    )
    into target_parent_is_descendant;

    if target_parent_id = target_location_id or target_parent_is_descendant then
      raise exception 'A location cannot be moved beneath itself or its descendants.'
        using errcode = '23514';
    end if;
  end if;

  update public.campaign_locations
  set
    parent_id = target_parent_id,
    name = trim(target_name),
    location_type = trim(target_location_type),
    description = trim(target_description),
    player_visible = target_player_visible
  where campaign_id = target_campaign_id
    and id = target_location_id;

  if not found then
    raise exception 'The location was not found in this campaign.'
      using errcode = 'P0002';
  end if;

  if length(trim(target_gm_notes)) > 0 then
    insert into public.campaign_location_gm_notes (
      campaign_id,
      location_id,
      notes
    )
    values (
      target_campaign_id,
      target_location_id,
      trim(target_gm_notes)
    )
    on conflict (campaign_id, location_id)
    do update set
      notes = excluded.notes,
      updated_at = now();
  else
    delete from public.campaign_location_gm_notes
    where campaign_id = target_campaign_id
      and location_id = target_location_id;
  end if;
end;
$$;

revoke all on function public.update_campaign_location(
  uuid, uuid, uuid, text, text, text, boolean, text
) from public, anon;
grant execute on function public.update_campaign_location(
  uuid, uuid, uuid, text, text, text, boolean, text
) to authenticated;
