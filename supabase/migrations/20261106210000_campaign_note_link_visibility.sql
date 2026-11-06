drop policy campaign_journal_entry_links_member_read
on public.campaign_journal_entry_links;

create policy campaign_journal_entry_links_member_read
on public.campaign_journal_entry_links for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    public.is_campaign_member(campaign_id)
    and exists (
      select 1
      from public.campaign_journal_entries as entry
      where entry.campaign_id = campaign_journal_entry_links.campaign_id
        and entry.id = campaign_journal_entry_links.entry_id
        and entry.player_visible
    )
    and (
      (
        location_id is not null
        and exists (
          select 1 from public.campaign_locations as location
          where location.campaign_id = campaign_journal_entry_links.campaign_id
            and location.id = campaign_journal_entry_links.location_id
            and location.player_visible
        )
      )
      or (
        npc_id is not null
        and exists (
          select 1 from public.campaign_npcs as npc
          where npc.campaign_id = campaign_journal_entry_links.campaign_id
            and npc.id = campaign_journal_entry_links.npc_id
            and npc.player_visible
        )
      )
      or (
        house_id is not null
        and exists (
          select 1 from public.campaign_houses as house
          where house.campaign_id = campaign_journal_entry_links.campaign_id
            and house.id = campaign_journal_entry_links.house_id
            and house.player_visible
        )
      )
      or (
        faction_id is not null
        and exists (
          select 1 from public.campaign_factions as faction
          where faction.campaign_id = campaign_journal_entry_links.campaign_id
            and faction.id = campaign_journal_entry_links.faction_id
            and faction.player_visible
        )
      )
      or (
        quest_id is not null
        and exists (
          select 1 from public.campaign_quests as quest
          where quest.campaign_id = campaign_journal_entry_links.campaign_id
            and quest.id = campaign_journal_entry_links.quest_id
            and quest.player_visible
        )
      )
      or (
        session_id is not null
        and exists (
          select 1 from public.campaign_sessions as session
          where session.campaign_id = campaign_journal_entry_links.campaign_id
            and session.id = campaign_journal_entry_links.session_id
            and session.player_visible
        )
      )
      or (
        event_id is not null
        and exists (
          select 1 from public.campaign_events as event
          where event.campaign_id = campaign_journal_entry_links.campaign_id
            and event.id = campaign_journal_entry_links.event_id
            and event.player_visible
        )
      )
      or (
        map_id is not null
        and exists (
          select 1 from public.campaign_maps as map
          where map.campaign_id = campaign_journal_entry_links.campaign_id
            and map.id = campaign_journal_entry_links.map_id
            and map.player_visible
        )
      )
    )
  )
);
