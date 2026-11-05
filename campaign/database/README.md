# Campaign database staging

The campaign database is now split into entity-specific JSON records under `records/`.

## Import-ready data

`../import/pathfinder_campaign_import.json` is the current import bundle for the app's GM data importer.

The bundle contains only entity types currently supported by the importer:

- locations
- NPCs
- houses
- house relationships
- factions
- quests
- sessions
- journal entries

## Source-only structured data

The following remain in separate files because the app importer does not currently have matching entities:

- shops
- regional features
- districts
- routes
- historical events
- religious institutions
- incidents
- evidence
- council representatives
- criminal-network detail
- unresolved/boundary notes

This is deliberate. Unsupported lore should not be stuffed into unrelated database fields just to make an import pass.

## Canon discipline

- Established canon is marked `ESTABLISHED`.
- Records without explicit player-sharing authorization remain GM-only.
- Stable keys are retained for import references.
- No political house relationship has been invented where the source material does not explicitly establish one.
- Unresolved questions remain unresolved.
- The Markdown campaign records remain the detailed canon source; these JSON files are the structured import layer.

## Current import counts

The import bundle currently contains 24 locations, 43 NPCs, 8 houses, 11 factions, and 2 quests. Sessions and journal entries are intentionally empty because the campaign has not yet generated established records for them.
