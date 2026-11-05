alter table public.campaign_character_attacks
  add column key_ability text not null default 'str'
    check (key_ability in ('str', 'dex', 'con', 'int', 'wis', 'cha')),
  add column damage_ability text not null default 'str'
    check (damage_ability in ('str', 'dex', 'con', 'int', 'wis', 'cha', 'none'));
