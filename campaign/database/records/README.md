# Organized campaign database records

This folder is the structured staging layer for campaign canon before app import.

## Files

- `locations.json` - settlements, regional features, and Tallowmere districts.
- `npcs.json` - established NPC records from the canonical seed and later batches.
- `houses.json` - Great Houses, House Denvor, and established House Relland.
- `house_relationships.json` - intentionally empty until political relationships are explicitly established.
- `factions.json` - civic, commercial, community, craft, and criminal factions.
- `quests.json` - current opening quests.
- `shops.json` - Tallowmere commercial premises.
- `regional_features.json` - rivers, woodland, ridges, fields, shore, bridge, pool, and beacon.
- `districts.json` - Tallowmere districts.
- `routes.json` - established roads and tracks.
- `historical_events.json` - established major historical events.
- `religious_institutions.json` - established religious institutions and principles.
- `incidents.json` - established campaign incidents, including the House Relland merchant incident.
- `evidence.json` - evidence tied to the House Relland incident.
- `council_representatives.json` - established Imperial Council representatives and council notes.
- `criminal_networks.json` - criminal-network detail retained separately from faction records.
- `unresolved.json` - unresolved boundaries and questions that must not be turned into facts during import.

## Import boundary

The app's current import format supports locations, NPCs, houses, house relationships, factions, quests, sessions, and journal entries. Unsupported database concepts remain in these files rather than being forced into unrelated app fields.

`campaign/import/pathfinder_campaign_import.json` is the import-ready bundle generated from the supported records.

No political house relationships are invented in the staging data. The database should only gain those relationships after the campaign canon explicitly establishes them.
