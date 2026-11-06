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

Tallowmere's current GM-calibrated atlas anchor is X=47.0993%, Y=29.3538% of the full atlas canvas, measured from the upper-left corner. Dragonstone is X=58.4224%, Y=38.1772%. These values were copied from the GM's saved Supabase atlas positions on 2026-11-06. They preserve the intended northwest relationship but remain normalized image positions, not surveyed geographic coordinates. Both are marked pending visual review against the authoritative artwork. See continent_reference.md.

## Prepared continent layer

- Data: `campaign/maps/atlas_player_layer.json`
- Review notes: `campaign/maps/atlas_player_layer.md`
- In the GM atlas, select the continent map with the atlas artwork and choose **Synchronize with Campaign Repository**. The server reads this committed JSON file; it is not uploaded from a user's computer.
- **Export calibrated coordinates** downloads a coordinate-only JSON patch for markers with stable repository `source_id` values. It deliberately skips unsourced app-only markers and is not a replacement for `atlas_player_layer.json`. Review the exported positions against authoritative artwork before merging them by `source_id` into the canonical layer.
- When a selected marker is linked to a child map under the current map and both reference the same campaign location, the GM marker panel offers **Open child map**. This enables the Tallowmere continent → region → city drill-down without guessing based on marker names.
- The current import layer contains only 15 major public-knowledge places: Great House seats, the capital, major cities, ports, and prominent fortresses. Smaller settlements are reserved for regional maps.
- `map_source_id` and each marker/overlay `source_id` are permanent identifiers. Keep them unchanged when renaming a map feature. Give new features unique identifiers; do not recycle IDs from removed features. A marker may optionally set `location_source_id` to associate markers on different map layers with one campaign location; when omitted, it defaults to the marker's `source_id`.
- Synchronization previews additions, repository-controlled field updates, and removals. Removals require GM confirmation, delete only synchronized map markers or overlays, and preserve campaign location records and linked lore. A rollback is available after applying a sync.
- Only repository-defined fields are synchronized. GM notes, discoveries, and other app-only content are preserved. Public visibility is applied only where the source explicitly declares it; never put GM-only information in public descriptions.
- The JSON `layers` array supports separate continent, kingdom, regional, city, settlement, district, interior, and dungeon layers. Each layer has its own `map_source_id`, map name/type, optional `parent_map_source_id`, and stable marker/overlay IDs. A layer initially matches a campaign map by exact name and type, then uses its persisted source ID. Parent references resolve to existing synchronized maps; map hierarchy and visibility are validated before applying changes.
- The current JSON intentionally contains no polygon overlays. The previous seven drafts mixed political territories, geographic regions, maritime influence, and the fragmented Southern Reaches; several political-looking shapes overlapped. They were removed rather than presented as borders or silently explained as wars.
- See `atlas_overlay_standards.md` for the required distinction between political, geographic, maritime, and route overlays. See `tallowmere_regional_layer_plan.md` for the public regional places and minor-house holdings around Tallowmere. See `tallowmere_city_layer_plan.md` for the city-level calibration and live-layer promotion rules. See `tallowmere_regional_content_spec.json` for the structured regional content registry. That registry is intentionally not a live synchronization layer yet because exact normalized coordinates remain unresolved. The approved regional artwork is now stored at campaign/maps/tallowmere_regional.png.
- All 15 current continental markers are explicitly designated public in the source. Tallowmere is linked to the canonical `tallowmere` campaign location by `location_source_id`; future child maps should use the same stable location source ID rather than name matching. Coordinates remain approximate; review them against the authoritative artwork before treating them as final.
- The JSON intentionally omits the GM-only dwarven underground route.


## Expanded atlas layer registry

- Canonical layer inventory: `campaign/maps/atlas_layer_registry.json`.
- Categories are explicitly separated: political territories, geographic regions, maritime influence, routes, and settlements/sites.
- The registry records all six Great Houses as broad political frameworks, but their exact boundaries remain unresolved. No political polygons are approved for import yet.
- Geographic regions include the Northern Wilderness, Western Highlands, Western Heartlands, Central Plains, Central Inland Sea, Northeastern Mountain System, Eastern Forests and Delta, Southwestern Marches, Southern Principalities, and Southern Islands.
- Kharadorn's Central Inland Sea dominion and Merrowen's maritime reach are recorded as maritime influence, not coastal sovereignty.
- Major overland and sea routes are registered separately from political and geographic overlays.
- The Tallowmere hierarchy is registered as Continent → Tallowmere Regional Map → Tallowmere City. The approved regional artwork is stored at `campaign/maps/tallowmere_regional.png`; the approved city artwork is stored at `campaign/maps/tallowmere_city.png`. Both still require cartographic calibration before their geometry is promoted into the live synchronization layer. The corresponding Supabase map records now carry the stable IDs `tallowmere_regional` and `tallowmere_city`.
- The registry is a canon and cartography planning source, not a live synchronization file. Only reviewed geometry should be promoted into `atlas_player_layer.json`.

## Map authority

The continental artwork's coastline and broad geographic features are fixed unless the GM explicitly approves a revision. Regional and city maps must fit the master atlas, not the other way around. Keep labels, political borders, and GM-only secrets in separate overlays where practical.
