# Tallowmere City Atlas Layer Plan

## Purpose

This file is the cartographic working plan for the player-facing Tallowmere city map.

It does not contain invented coordinates. Features are promoted into the live atlas layer only after the approved artwork is visually calibrated against the established city canon.

## Authoritative sources

- Artwork: `campaign/maps/tallowmere_city.png`
- City layout and defenses: `campaign/locations/starting_city/City_Layout_and_Defenses.md`
- City overview: `campaign/locations/starting_city/City_Overview.md`
- Streets and landmarks: `campaign/locations/starting_city/Streets_Landmarks_and_Routes.md`
- Regional geography: `campaign/locations/starting_city/Regional_Geography_and_Points_of_Interest.md`
- Atlas registry: `campaign/maps/atlas_layer_registry.json`

## Map hierarchy

- Continental atlas: `continent_atlas`
- Tallowmere regional map: `tallowmere_regional`
- Tallowmere city map: `tallowmere_city`

The city map belongs beneath the Tallowmere regional map. The regional map remains the parent geographic context.

## Confirmed city features to calibrate

### Major location

- Tallowmere
- Greywatch

### Districts

- Greywatch Rise
- High Ward
- Old Quays
- New Quays
- Market Ward
- Rivergate
- Lantern Ward
- Underways

### Gates

- West Gate
- North Gate
- River Gate
- South Gate
- Harbor Gates

### Established roads and routes

- Western Mountain Road
- Northern Road
- King's Road
- Eastern Coastal Road
- Southern Trade Road
- Inland Sea Route

### Geographic and defensive features

- Natural harbor
- River Vale mouth / estuary
- Harbor mouth
- Irregular old wall line
- Later wall additions
- Steep ground around the older city
- Greywatch's elevated position overlooking the harbor approach

## Calibration rules

1. Do not force the city into a regular circular or rectangular shape.
2. Do not invent streets, districts, gates, walls, bridges, docks, towers, or buildings.
3. Do not infer exact coordinates from written descriptions alone.
4. The artwork controls visual placement once confirmed against the written canon.
5. Written canon controls the existence and names of features when the artwork is ambiguous.
6. The artwork does not override established lore merely because it contains a visually plausible feature.
7. Underways are a patchwork subterranean network, not a single surface-visible district or perfectly mapped level.
8. Greywatch must remain on high ground with command over the harbor approach.
9. Harbor and river geometry must remain consistent with Tallowmere's position at the River Vale mouth on the northwestern shore of the central inland sea.

## Live-layer promotion criteria

A feature may be added to `atlas_player_layer.json` only when:

- the feature is established in campaign canon;
- its presence and approximate placement can be verified on the approved city artwork;
- its normalized x/y position has been calibrated against the artwork;
- its player visibility is appropriate;
- its source ID is stable and unique.

District and route geometry should not be promoted as polygons or line paths until the artwork has been visually calibrated.

## Current status

The city artwork is stored in the canonical map library, but the repository integration is not yet a surveyed cartographic layer. The next safe step is visual calibration of the artwork against the city canon, followed by creation of stable marker coordinates and only then live atlas synchronization.

## Explicitly unresolved

- Exact wall geometry
- Exact gate positions
- Exact district boundaries
- Exact road courses
- Exact harbor works
- Exact Greywatch footprint and scale
- Exact Underways entrances or surface access points

These remain unresolved rather than being filled with plausible-looking fantasy cartography. Humanity has suffered enough from invented borders.
