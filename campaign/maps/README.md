# Map Library

Map artwork and structured map metadata belong here. The continental atlas is the **authoritative master geographic reference**.

## Planned hierarchy

Continent → Kingdom → Region → City → District / Site → Interior map

## Authoritative continental source

- File: campaign/maps/continent_atlas.png
- Record: campaign/maps/continent_reference.md
- Status: ESTABLISHED / AUTHORITATIVE MASTER MAP
- Orientation: north up
- Image dimensions: 1,161 × 1,355 pixels
- Approved working extent: approximately 1,700 miles north-south × 1,300 miles east-west at widest point.
- The obsolete 0–1,000-mile scale bar from the original artwork is not a valid measurement reference. Do not use it for distance calculations. Use approved working dimensions and calibrated regional maps.

## Tallowmere registration

Tallowmere's provisional map anchor is X=44%, Y=43% of the full atlas canvas, measured from the upper-left corner. This represents the city/harbor area on the northwestern shore of the central inland sea. It is not a surveyed coordinate. See continent_reference.md.

## Prepared continent layer

- Data: `campaign/maps/atlas_player_layer.json`
- Review notes: `campaign/maps/atlas_player_layer.md`
- In the GM atlas, select the continent map with the atlas artwork and choose **Synchronize with Campaign Repository**. The server reads this committed JSON file; it is not uploaded from a user's computer.
- The current import layer contains only 15 major public-knowledge places: Great House seats, the capital, major cities, ports, and prominent fortresses. Smaller settlements are reserved for regional maps.
- `map_source_id` and each marker/overlay `source_id` are permanent identifiers. Keep them unchanged when renaming a map feature. Give new features unique identifiers; do not recycle IDs from removed features. A marker may optionally set `location_source_id` to associate markers on different map layers with one campaign location; when omitted, it defaults to the marker's `source_id`.
- Synchronization previews additions, repository-controlled field updates, and removals. Removals require GM confirmation, delete only synchronized map markers or overlays, and preserve campaign location records and linked lore. A rollback is available after applying a sync.
- Only repository-defined fields are synchronized. GM notes, discoveries, and other app-only content are preserved. Public visibility is applied only where the source explicitly declares it; never put GM-only information in public descriptions.
- The JSON `layers` array supports separate continent, kingdom, regional, city, settlement, district, interior, and dungeon layers. Each layer has its own `map_source_id`, map name/type, optional `parent_map_source_id`, and stable marker/overlay IDs. A layer initially matches a campaign map by exact name and type, then uses its persisted source ID. Parent references resolve to existing synchronized maps; map hierarchy and visibility are validated before applying changes.
- The current JSON intentionally contains no polygon overlays. The previous seven drafts mixed political territories, geographic regions, maritime influence, and the fragmented Southern Reaches; several political-looking shapes overlapped. They were removed rather than presented as borders or silently explained as wars.
- See `atlas_overlay_standards.md` for the required distinction between political, geographic, maritime, and route overlays. See `tallowmere_regional_layer_plan.md` for the public regional places and minor-house holdings around Tallowmere.
- All 15 current continental markers are explicitly designated public in the source. Coordinates remain approximate; review them against the authoritative artwork before treating them as final.
- The JSON intentionally omits the GM-only dwarven underground route.

## Map authority

The continental artwork's coastline and broad geographic features are fixed unless the GM explicitly approves a revision. Regional and city maps must fit the master atlas, not the other way around. Keep labels, political borders, and GM-only secrets in separate overlays where practical.
