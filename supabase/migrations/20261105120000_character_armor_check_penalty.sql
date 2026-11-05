alter table public.campaign_character_combat
  add column armor_check_penalty smallint not null default 0
    check (armor_check_penalty between -100 and 0);
