# Continent Atlas Player Layer

**Status:** Prepared visual layer; GM review required before sharing
**Parent map:** `campaign/maps/continent_atlas.png`  
**Coordinate convention:** normalized image coordinates; X=0 at left, Y=0 at top; north is up.

## Purpose

This file prepares the first useful player-facing atlas layer: major seats, named settlements, and broad political/geographic regions. Coordinates are approximate visual placements on the authoritative atlas. They are not surveyed coordinates and must not be treated as final geographic canon.

The GM atlas can import this JSON into a world or continent map with artwork. Select
`campaign/maps/atlas_player_layer.json` in the map overlay panel and start the
import. The import
creates missing locations, links markers to them, and adds the overlays. It
reuses matching campaign locations and leaves existing same-name markers and
overlays unchanged. All new records remain GM-only until reviewed and explicitly
shared, regardless of the visibility flags in the JSON.

The app supports these elements:
- Marker types: city, settlement, fortress, ruins, landmark, port, hidden.
- Region and route overlays, each stored as normalized points.
- Independent player-visible flags for maps, markers, and overlays.
- Map hierarchy through parent/child map records.

## Player-facing content

The companion JSON file `atlas_player_layer.json` contains:
- Principal seats: Frosthold, Aurelith, Stoneguard, Valedorn, Dragonstone, Khar-Dum, and Tidemark.
- Other established named settlements listed in the approved Stage 5 political geography.
- Tallowmere, linked conceptually to the approved regional map.
- Seven broad region overlays for the Great House spheres and the fragmented Southern Reaches.

## Important canon safeguards

1. **These are approximate placements.** The continent map establishes broad regions, not surveyed coordinates. The JSON's marker coordinates are cartographic starting points for the GM to adjust visually in the atlas editor.
2. **Region overlays are not borders.** The exact borders of all Great House territories remain unresolved. The overlays are intentionally named as spheres or broad zones and must not be described as surveyed boundaries.
3. **Kharadorn's central sea dominion is a sphere of influence**, not a claim that every shore settlement is directly administered by dwarves. The northeastern Khar-Dum homeland is distinct from Dragonstone.
4. **The Southern Reaches are fragmented.** Their overlay is a broad geographic/political zone, not a unified state.
5. **Do not add the dwarven underground route to Dragonstone.** It is a GM-only secret and must never appear in player-visible markers, overlays, notes, or map descriptions.
6. The atlas artwork itself contains no GM-only annotations. It can be marked player-visible once the GM is satisfied with the public marker and overlay layer.
7. Do not expose unconfirmed minor-house boundaries, local jurisdictions, or the exact location of Tallowmere's regional landmarks on the continent map.

## Tallowmere

The approved macro placement is the northwestern shore of the central inland sea, at the mouth of the River Vale. The current anchor is X=44%, Y=43%. The map editor should be used to verify the marker sits on land beside the river mouth, not in the sea. The regional map should later become a child map of Tallowmere's location; the city map should become a child map of the regional map.

## Recommended order in the app

1. Confirm the world or continent atlas map record has the atlas artwork attached.
2. Select it in the GM atlas and choose **Import prepared atlas layer**.
3. Review marker placements, location descriptions, and broad region overlays against the artwork; adjust as needed.
4. Share only the records approved for players, then mark the continent map player-visible.
5. Link the Tallowmere regional map as a child map of Tallowmere's location/continent context; then link the city map as a child of the regional map.

## What is deliberately omitted

- Exact political borders.
- Minor-house holdings and borders.
- Uncharted roads and trade-route lines.
- The secret dwarven tunnel to Dragonstone.
- Undocumented settlements, castles, ruins, and geographic names.
- Any claim that the visible rivers are the finalized courses of every named regional river.


## App behavior note for Copilot

The current atlas viewer supports marker selection and a separate **Explore within** child-map navigation list. Marker clicks currently select a marker; they do not yet navigate to a child map. To implement the intended Tallowmere drill-down without adding an unnecessary schema field:

- Give the Tallowmere marker a linked `campaign_locations` record.
- Set the regional map's `parent_map_id` to the continent map and its `location_id` to the same Tallowmere location record.
- Set the city map's `parent_map_id` to the regional map and its `location_id` to that same Tallowmere location record.
- On marker activation, find a child map of the currently selected map whose `location_id` matches the marker's `location_id`; navigate to it when exactly one matching child with artwork exists. If none exists, retain normal marker selection/details behavior.
- On the regional map, the city map appears as its child in the existing hierarchy navigation. A later extension can make the city drill-down clickable from the city marker on the regional map.
- Preserve breadcrumbs so players can return from city → region → continent.

The player-facing visibility chain must be valid at every level: continent map, regional map, city map, linked Tallowmere location, marker, and any player-visible overlays. The database already enforces that player-visible child maps require a player-visible parent map. A marker linked to a location is only visible if that location is also player-visible.
