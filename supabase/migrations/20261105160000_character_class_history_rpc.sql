create function public.save_campaign_character_class(
  target_campaign_id uuid,
  target_character_id uuid,
  target_class_name text,
  target_class_type text,
  target_archetype text,
  target_level smallint,
  target_favored_class boolean,
  target_notes text,
  target_campaign_date text,
  target_history_description text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_class_id uuid;
  existing_level smallint;
  saved_class_id uuid;
begin
  if not public.is_campaign_character_owner(
    target_campaign_id,
    target_character_id
  ) then
    raise exception 'Character not found or not owned by the current player.';
  end if;

  select class_record.id, class_record.level
  into existing_class_id, existing_level
  from public.campaign_character_classes as class_record
  where class_record.campaign_id = target_campaign_id
    and class_record.character_id = target_character_id
    and class_record.class_name = target_class_name
  for update;

  insert into public.campaign_character_classes (
    campaign_id,
    character_id,
    class_name,
    class_type,
    archetype,
    level,
    favored_class,
    notes,
    source,
    updated_at
  )
  values (
    target_campaign_id,
    target_character_id,
    target_class_name,
    target_class_type,
    target_archetype,
    target_level,
    target_favored_class,
    target_notes,
    'player',
    now()
  )
  on conflict (campaign_id, character_id, class_name)
  do update set
    class_type = excluded.class_type,
    archetype = excluded.archetype,
    level = excluded.level,
    favored_class = excluded.favored_class,
    notes = excluded.notes,
    source = 'player',
    updated_at = now()
  returning id into saved_class_id;

  if existing_class_id is null or existing_level <> target_level then
    insert into public.campaign_character_level_history (
      campaign_id,
      character_id,
      class_id,
      level,
      campaign_date,
      description,
      source
    )
    values (
      target_campaign_id,
      target_character_id,
      saved_class_id,
      target_level,
      target_campaign_date,
      target_history_description,
      'player'
    );
  end if;
end;
$$;

revoke all on function public.save_campaign_character_class(
  uuid, uuid, text, text, text, smallint, boolean, text, text, text
) from public, anon;
grant execute on function public.save_campaign_character_class(
  uuid, uuid, text, text, text, smallint, boolean, text, text, text
) to authenticated;
