create function public.save_campaign_character_class(
  target_campaign_id uuid,
  target_character_id uuid,
  target_class_name text,
  target_class_type text,
  target_archetype text,
  target_level integer,
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
begin
  if target_level < 1 or target_level > 20 then
    raise exception 'Class level must be between 1 and 20.';
  end if;

  perform public.save_campaign_character_class(
    target_campaign_id,
    target_character_id,
    target_class_name,
    target_class_type,
    target_archetype,
    target_level::smallint,
    target_favored_class,
    target_notes,
    target_campaign_date,
    target_history_description
  );
end;
$$;

revoke all on function public.save_campaign_character_class(
  uuid, uuid, text, text, text, integer, boolean, text, text, text
) from public, anon;
grant execute on function public.save_campaign_character_class(
  uuid, uuid, text, text, text, integer, boolean, text, text, text
) to authenticated;
