update public.campaign_character_combat as combat
set misc_ac_bonus = character.armor_class - 10 - coalesce(
  (
    select floor(
      (
        score.base_score
        + score.permanent_modifier
        + score.temporary_modifier
        - 10
      )::numeric / 2
    )::integer
    from public.campaign_character_ability_scores as score
    where score.campaign_id = character.campaign_id
      and score.character_id = character.id
      and score.ability = 'dex'
  ),
  0
)
from public.campaign_characters as character
where combat.campaign_id = character.campaign_id
  and combat.character_id = character.id
  and combat.source = 'legacy';

create function public.correct_legacy_campaign_character_ac()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.campaign_character_combat as combat
  set misc_ac_bonus = new.armor_class - 10
    - coalesce(
      (
        select floor(
          (
            score.base_score
            + score.permanent_modifier
            + score.temporary_modifier
            - 10
          )::numeric / 2
        )::integer
        from public.campaign_character_ability_scores as score
        where score.campaign_id = new.campaign_id
          and score.character_id = new.id
          and score.ability = 'dex'
      ),
      0
    )
    - combat.armor_bonus
    - combat.shield_bonus
    - combat.natural_armor_bonus
    - combat.deflection_bonus
    - combat.dodge_bonus
  where combat.campaign_id = new.campaign_id
    and combat.character_id = new.id
    and combat.source = 'legacy';

  return new;
end;
$$;

create trigger campaign_characters_zz_correct_legacy_ac
after insert or update of armor_class on public.campaign_characters
for each row
execute function public.correct_legacy_campaign_character_ac();

create function public.sync_normalized_character_to_legacy()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  record_source text;
  target_campaign_id uuid;
  target_character_id uuid;
  target_ability text;
  target_score smallint;
begin
  if tg_op = 'DELETE' then
    record_source := old.source;
    target_campaign_id := old.campaign_id;
    target_character_id := old.character_id;
  else
    record_source := new.source;
    target_campaign_id := new.campaign_id;
    target_character_id := new.character_id;
  end if;

  if record_source <> 'player' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_table_name = 'campaign_character_identity' then
    update public.campaign_characters
    set background = new.biography,
        appearance = new.appearance
    where campaign_id = target_campaign_id
      and id = target_character_id;
  elsif tg_table_name = 'campaign_character_combat' then
    update public.campaign_characters as character
    set current_hp = new.current_hp,
        max_hp = new.max_hp,
        speed = new.speed,
        armor_class =
          10
          + coalesce(
            (
              select floor(
                (
                  score.base_score
                  + score.permanent_modifier
                  + score.temporary_modifier
                  - 10
                )::numeric / 2
              )::integer
              from public.campaign_character_ability_scores as score
              where score.campaign_id = target_campaign_id
                and score.character_id = target_character_id
                and score.ability = 'dex'
            ),
            0
          )
          + new.armor_bonus
          + new.shield_bonus
          + new.natural_armor_bonus
          + new.deflection_bonus
          + new.dodge_bonus
          + new.misc_ac_bonus
    where character.campaign_id = target_campaign_id
      and character.id = target_character_id;
  elsif tg_table_name = 'campaign_character_ability_scores' then
    if tg_op = 'DELETE' then
      target_ability := old.ability;
      target_score := null;
    else
      target_ability := new.ability;
      target_score := new.base_score;
    end if;

    update public.campaign_characters as character
    set strength = case when target_ability = 'str' then target_score else strength end,
        dexterity = case when target_ability = 'dex' then target_score else dexterity end,
        constitution = case when target_ability = 'con' then target_score else constitution end,
        intelligence = case when target_ability = 'int' then target_score else intelligence end,
        wisdom = case when target_ability = 'wis' then target_score else wisdom end,
        charisma = case when target_ability = 'cha' then target_score else charisma end,
        armor_class =
          10
          + coalesce(
            (
              select floor(
                (
                  score.base_score
                  + score.permanent_modifier
                  + score.temporary_modifier
                  - 10
                )::numeric / 2
              )::integer
              from public.campaign_character_ability_scores as score
              where score.campaign_id = target_campaign_id
                and score.character_id = target_character_id
                and score.ability = 'dex'
            ),
            0
          )
          + coalesce(
            (
              select combat.armor_bonus
                + combat.shield_bonus
                + combat.natural_armor_bonus
                + combat.deflection_bonus
                + combat.dodge_bonus
                + combat.misc_ac_bonus
              from public.campaign_character_combat as combat
              where combat.campaign_id = target_campaign_id
                and combat.character_id = target_character_id
            ),
            0
          )
    where character.campaign_id = target_campaign_id
      and character.id = target_character_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger campaign_character_identity_to_legacy
after insert or update on public.campaign_character_identity
for each row
execute function public.sync_normalized_character_to_legacy();

create trigger campaign_character_ability_scores_to_legacy
after insert or update or delete on public.campaign_character_ability_scores
for each row
execute function public.sync_normalized_character_to_legacy();

create trigger campaign_character_combat_to_legacy
after insert or update on public.campaign_character_combat
for each row
execute function public.sync_normalized_character_to_legacy();

revoke all on function public.correct_legacy_campaign_character_ac()
from public, anon;
revoke all on function public.sync_normalized_character_to_legacy()
from public, anon;
