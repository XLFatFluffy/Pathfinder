update public.campaign_character_identity as identity_record
set source = 'legacy'
from public.campaign_characters as character
where identity_record.campaign_id = character.campaign_id
  and identity_record.character_id = character.id
  and identity_record.source = 'player'
  and identity_record.biography = character.background
  and identity_record.appearance = character.appearance;

update public.campaign_character_combat as combat_record
set source = 'legacy'
from public.campaign_characters as character
where combat_record.campaign_id = character.campaign_id
  and combat_record.character_id = character.id
  and combat_record.source = 'player'
  and combat_record.current_hp = character.current_hp
  and combat_record.max_hp = character.max_hp
  and combat_record.misc_ac_bonus = character.armor_class - 10
  and combat_record.speed = character.speed;
