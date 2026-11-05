# Continent Atlas Player Layer

**Status:** Curated draft for GM review  
**Parent map:** `campaign/maps/continent_atlas.png`  
**Coordinate convention:** normalized image coordinates; X=0 at left, Y=0 at top; north is up.

## Purpose

This is the continental player-facing layer. It contains major places that would be common knowledge to reasonably informed inhabitants of the continent: Great House seats, the capital, major cities and ports, and prominent fortresses. Players do not need to discover that these places exist. Exploration can reveal details, routes, occupants, defenses, and local conditions, but not the basic existence of major landmarks.

The JSON intentionally contains only 15 major-place markers. Smaller villages, minor keeps, manors, hamlets, and local landmarks belong on regional maps or in GM reference records. They have not been deleted from campaign canon; they have simply been removed from the continental overview to avoid turning the map into a settlement directory.

## Current continental markers

- **Great House seats and principal strongholds:** Frosthold, Aurelith, Stoneguard, Valedorn, Khar-Dum, Dragonstone, and Tidemark.
- **Other major fortified or strategic places:** Greywatch, Deepwatch, and Eastwatch.
- **Major ports:** Tallowmere, Ironharbor, Deltaport, Stormhaven, and Duskport.

All 15 are intended as public-knowledge locations, subject to GM review of placement and wording. The coordinates remain approximate and must be checked visually against the authoritative atlas before import or sharing.

## Overlay decision

The previous seven polygon drafts have been removed from the import layer. They mixed political spheres, geographic regions, maritime influence, and the fragmented Southern Reaches. Several Great House polygons overlap. Because exact borders are unresolved, those overlaps must not be presented as sovereign territorial claims or silently explained as wars.

No replacement polygons have been drawn yet. The new classification and drawing rules are in `atlas_overlay_standards.md`. In brief:

- Political territories: distinct, adjoining, and non-overlapping unless a specific disputed claim or war is approved as canon.
- Geographic regions: may cross political borders and should use a separate visual treatment.
- Maritime influence: a sea-based influence or naval sphere, not land sovereignty over every shore.
- Southern Reaches: three distinct broad zones (Southwestern Marches, Southern Principalities, Southern Islands), with fragmented political authority rather than one unified realm.

The absence of overlays is deliberate. An honest unfinished map is better than a confident map that accidentally starts three wars.

## Player knowledge and discovery

### Public from campaign start
- All Great House principal seats.
- The capital and major cities.
- Major ports, major fortresses, and strategically important crossings or landmarks once identified as such in canon.
- The existence and broad location of major geographic features shown on the authoritative atlas.

### Regional-map detail
- Ordinary villages and smaller settlements.
- Minor-house manors, keeps, estate villages, and local holdings.
- Local roads, bridges, mills, quarries, beacons, and other points of interest.
- Detailed jurisdictional boundaries and local political relationships where publicly known.

### GM-only or discovery-gated
- Secret routes, hidden sites, concealed identities, private holdings, and sensitive history.
- The dwarven underground route to Dragonstone remains GM-only and must not appear in player-visible markers, overlays, notes, or map descriptions.
- Secrets connected to House Relland's historical crime remain GM-only; do not expose the incident through a public map description.

## Tallowmere hierarchy

Tallowmere is on the northwestern shore of the central inland sea, at the mouth of the River Vale. Its current continental anchor is X=44%, Y=43%. This is a cartographic starting point, not a surveyed coordinate.

Intended hierarchy:
1. Continent map: major public places.
2. Tallowmere regional map: nearby settlements, minor houses, roads, crossings, and natural landmarks.
3. Tallowmere city map: districts, gates, streets, civic buildings, and local sites.

The regional map should be a child map of Tallowmere's linked location. The city map should be a child of the regional map. Preserve breadcrumbs back to the continent.

## Import notes

The GM atlas importer creates missing locations and markers but leaves existing same-name markers unchanged. It also creates imported records as GM-only until visibility is explicitly reviewed and changed in the app. Re-importing this JSON will therefore not update existing markers with the same names; review or edit existing records separately if an earlier draft was already imported.

The importer currently takes one marker description and uses it as the location description. It does not yet provide separate player-facing descriptions and GM-only notes through this JSON format. Keep sensitive lore out of marker descriptions until that importer capability is added.

## Authority

The continental artwork is the authoritative geographic reference. Its coastline and broad geographic features are fixed unless the GM explicitly approves a revision. Regional and city maps must fit the master atlas, not the other way around. See `continent_reference.md`.
