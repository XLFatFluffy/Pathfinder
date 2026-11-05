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
- In the GM atlas, select the world or continent map with the atlas artwork, choose `campaign/maps/atlas_player_layer.json`, and choose **Import prepared atlas layer**.
- The current import layer contains only 15 major public-knowledge places: Great House seats, the capital, major cities, ports, and prominent fortresses. Smaller settlements are reserved for regional maps.
- The current JSON intentionally contains no polygon overlays. The previous seven drafts mixed political territories, geographic regions, maritime influence, and the fragmented Southern Reaches; several political-looking shapes overlapped. They were removed rather than presented as borders or silently explained as wars.
- See `atlas_overlay_standards.md` for the required distinction between political, geographic, maritime, and route overlays. See `tallowmere_regional_layer_plan.md` for the public regional places and minor-house holdings around Tallowmere.
- Imported locations and markers remain GM-only until reviewed and explicitly shared. Coordinates remain approximate; review them against the authoritative artwork before treating them as final.
- Existing same-name markers and overlays are left unchanged by the importer. Re-importing this revised JSON will not update earlier imported records; adjust those records separately if an earlier draft was already imported.
- The JSON intentionally omits the GM-only dwarven underground route.

## Map authority

The continental artwork's coastline and broad geographic features are fixed unless the GM explicitly approves a revision. Regional and city maps must fit the master atlas, not the other way around. Keep labels, political borders, and GM-only secrets in separate overlays where practical.
