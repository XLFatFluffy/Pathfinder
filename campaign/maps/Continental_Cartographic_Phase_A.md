# Phase A — Continental Cartographic Completion

**Status:** MAJOR-PLACE COORDINATES CALIBRATED; SIX ROUTES DRAFTED; POLITICAL AND GEOGRAPHIC POLYGONS PENDING  
**Date:** 2026-11-06  
**Authority:** GM-approved canon in the campaign repository

## Purpose

Phase A establishes the complete continental cartographic specification before political borders are promoted into the live player atlas. It separates what is canonically known from what still requires visual tracing against the authoritative artwork.

The authoritative continental artwork is `campaign/maps/continent_atlas.png`. It fixes the coastline and broad geographic identity. The registry and written canon determine which features belong on the map; the artwork determines their final visual course and placement.

## Continental content policy

The continental layer contains:

- Great House principal seats and major strongholds
- Valedorn and other major cities
- Major ports
- Major fortresses
- Dragonstone and Khar-Dum
- Other continent-scale settlements explicitly approved as major places
- Established continent-scale roads and trade routes
- The Central Inland Sea
- Major geographic systems
- Approved political territories once their borders are calibrated and approved

Minor regional settlements remain on regional maps.

## Established continental road network

The following major routes are canonically established:

1. **Northern Road**
   - Major north-south overland corridor.
   - Connects the northern territories with the central political and commercial network.
   - Exact course: trace against the authoritative artwork.

2. **Western Mountain Road**
   - Major route through the western highlands and mountain approaches.
   - Exact course: trace against the authoritative artwork.

3. **King's Road**
   - Principal Crown-associated overland route connecting the central royal sphere with major regions.
   - Exact course: trace against the authoritative artwork.

4. **Eastern Coastal Road**
   - Major route serving the eastern coastal network.
   - Exact course: trace against the authoritative artwork.
   - It does not imply Merrowen sovereignty over every settlement along the coast.

5. **Southern Trade Road**
   - Major commercial corridor serving the fragmented Southern Reaches.
   - Exact course: trace against the authoritative artwork.
   - The road does not imply a unified southern political authority.

6. **Inland Sea Route**
   - Navigable commercial route across the Central Inland Sea.
   - Represent as a maritime route rather than a political border.
   - Do not use it to imply Kharadorn sovereignty over every shoreline.

### Route drawing rule

Only the named established routes above may be rendered as solid established continental routes. Their final polylines must follow the actual artwork and terrain. No coordinate values are invented in this document.

## Political territory framework

The six Great Houses have approved broad territorial frameworks:

| Great House | Approved broad territory | Principal seat |
|---|---|---|
| Veyr | Northern Marches / northern territories | Frosthold |
| Vaelorian | Western Highlands | Aurelith |
| Edarth | Western Heartlands | Stoneguard |
| Calderan | Inland Central Crownlands | Valedorn |
| Kharadorn | Dragonstone, Central Inland Sea sphere, and northeastern ancestral dominion around Khar-Dum | Khar-Dum / Dragonstone |
| Merrowen | Eastern maritime and coastal territory | Tidemark |

These are political frameworks, not final polygon coordinates.

### Border rules

When exact borders are drafted:

- Normal political territories must not overlap.
- Borders should follow established geography where canon supports it.
- A maritime sphere must remain distinct from coastal sovereignty.
- A charter, toll right, ferry right, crossing right, trade route, or strategic interest is not automatically a territorial border.
- Southern polities remain fragmented and must not be collapsed into a single Southern Kingdom.
- Unresolved territory must remain visibly provisional rather than being silently assigned.

### Great House border drafting order

Draft boundaries in this order:

1. Veyr / northern frontier
2. Vaelorian / western highlands
3. Edarth / western heartlands
4. Calderan / central Crownlands
5. Merrowen / eastern maritime and coastal territory
6. Kharadorn / northeastern dominion
7. Kharadorn's Central Inland Sea maritime sphere as a separate maritime layer
8. Southern independent territories and minor houses

This order reduces accidental overlap and makes major geographic constraints visible before minor jurisdictions are drawn.

## Geographic overlay framework

The following geographic regions are established as non-political overlays:

- Northern Wilderness
- Northern Mountain and Forest Systems
- Western Highlands
- Western Forests
- Western Heartlands
- Central Plains
- Central Inland Sea
- Northeastern Mountain System
- Eastern Forests
- Eastern River Delta
- Southwestern Marches
- Southern Principalities
- Southern Islands

Geographic regions may cross political borders. They must use a visual treatment distinct from political territory fills.

## Major-place rule

The continental map is deliberately sparse.

A settlement belongs on the continental layer only when it is a major city, Great House seat/stronghold, major port, prominent fortress, or otherwise approved continent-scale location.

Regional settlements such as Millhaven, Brackenholt, Stonehollow, Saltwick, Fordmere, Harthbridge, and Ashcombe Manor remain on the Tallowmere regional layer.

## Calibration rule

The following coordinates already exist as GM-calibrated anchors and may be retained pending visual review:

- Tallowmere: x=0.470993, y=0.293538
- Dragonstone: x=0.584224, y=0.381772

Other continental coordinates are not treated as surveyed. Existing approximate marker positions must be visually checked against the authoritative artwork before being promoted to final geometry.

## Completion gate for Phase A

Phase A is considered **cartographically complete** only when:

- Continental major-place anchors have been visually reviewed.
- The six Great House boundaries have been drafted as non-overlapping provisional polygons.
- The major continental roads have been traced as editable polylines.
- The Central Inland Sea route has been traced separately from political territory.
- Geographic overlays have been classified and visually calibrated.
- The Southern Reaches remain correctly fragmented.
- No GM-only route or secret has entered the player layer.
- The resulting geometry has been reviewed against the authoritative artwork.
- Only approved geometry is promoted into `atlas_player_layer.json`.

Until those gates are met, the registry remains the planning/canon source and the live player layer must not pretend unresolved geometry is authoritative.

## Phase A decision

The repository now treats the continental map as a **calibration-and-tracing task**, not an open-ended geography invention task. The geographic identity, major places, route network, Great House framework, and layer separation are established. Remaining work is to trace and approve geometry without inventing unsupported borders or coordinates.


## Overlay set created

Phase A now has a dedicated GM-only overlay registry at `campaign/maps/continental_overlay_registry.json`. It classifies every continental overlay into political, geographic, maritime, and route categories and assigns stable source IDs. The registry retains null geometry for unresolved political, geographic, and maritime polygons. The six established route courses have now been drafted against the authoritative artwork and saved as editable polylines, pending GM review. This prevents the atlas from turning broad canon into invented borders or routes.

The overlay registry is not a player synchronization layer. Once geometry is traced and reviewed, approved records can be promoted into `atlas_player_layer.json` using the existing app-supported `region` and `route` overlay types.


## 2026-11-06 coordinate and route pass

The GM-exported coordinate patch was merged by stable marker `source_id` into the 15 continental major-place records. The positions were visually reviewed against the 1,161 × 1,355 authoritative image. Six established route overlays were drafted as editable normalized polylines: Northern Road, Western Mountain Road, King's Road, Eastern Coastal Road, Southern Trade Road, and Inland Sea Route. These routes connect established major places and follow broad land/sea corridors, but are not surveyed road courses. They remain subject to GM review. No political borders, geographic region polygons, or maritime influence polygons were invented or promoted; their geometry remains unresolved.
