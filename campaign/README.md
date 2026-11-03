# Campaign Records

This directory contains the campaign's canonical world and campaign records. The application code remains separate from campaign data.

## Source of truth

- [Campaign Bible](Campaign_Bible.md) is the current master reference imported from the uploaded Campaign Bible document.
- Canon status must be explicit. Brainstorming does not become canon automatically.
- Preserve unresolved mysteries and conflicting source statements. Do not silently reconcile them.
- GM-only information must remain clearly marked and must never be exposed in player-facing exports.

## Organization

- `geography/`: continent, kingdoms, regions, cities, and locations.
- `politics/`: noble houses, dynasties, succession, and political relationships.
- `people/`: NPCs, families, and character relationships.
- `factions/`: religious, military, criminal, commercial, and other organizations.
- `maps/`: map artwork, map metadata, and parent/child map relationships.
- `economy/`: shops, merchants, goods, and trade routes.
- `player_characters/`: player character records. Keep private character information access-controlled.
- `world_events/`: active and historical world events.
- `sessions/`: session records live at the repository's top-level `sessions/` directory.

## Record convention

Each substantial record should identify:
- Name and stable ID
- Canon status: PROPOSED, APPROVED, ESTABLISHED, REJECTED, REVISED, or UNRESOLVED
- Visibility: GM_ONLY, PLAYER_SHARED, or PUBLIC
- Summary and detailed information
- Relationships to other records
- Source / session where it was established
- Last updated date

Do not invent missing details to make a record look complete.
