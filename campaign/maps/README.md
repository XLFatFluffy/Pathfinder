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
- In the GM atlas, select the continent map with its artwork, choose `campaign/maps/atlas_player_layer.json`, and choose **Import prepared atlas layer**.
- The import creates missing locations, links their markers, and adds the region overlays. Existing same-name markers and overlays are left unchanged; matching campaign locations are reused.
- Imported locations, markers, and overlays are GM-only until reviewed and explicitly shared. Coordinates and broad region shapes remain approximate; review them against the atlas before treating them as canon.
- The JSON intentionally omits the GM-only dwarven underground route.

## Map authority

The continental artwork's coastline and broad geographic features are fixed unless the GM explicitly approves a revision. Regional and city maps must fit the master atlas, not the other way around. Keep labels, political borders, and GM-only secrets in separate overlays where practical.
