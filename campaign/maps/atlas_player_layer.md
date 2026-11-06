# Continent Atlas Player Layer

**Status:** Curated draft with calibrated major-place coordinates and six route drafts for GM review  
**Parent map:** `campaign/maps/continent_atlas.png`  
**Coordinate convention:** normalized image coordinates; X=0 at left, Y=0 at top; north is up.

## Purpose

This is the continental player-facing layer. It contains major places that would be common knowledge to reasonably informed inhabitants of the continent: Great House seats, the capital, major cities and ports, and prominent fortresses. Players do not need to discover that these places exist. Exploration can reveal details, routes, occupants, defenses, and local conditions, but not the basic existence of major landmarks.

The JSON contains 15 major-place markers and six route overlays. The route lines are approved cartographic shorthand connecting established major places, not surveyed road alignments. The Northern Road's final approach to Dragonstone is understood to cross the natural landbridge; the line's small visual offset at this scale is intentional and does not imply a sea crossing. Smaller villages, minor keeps, manors, hamlets, and local landmarks belong on regional maps or in GM reference records. They have not been deleted from campaign canon; they have simply been removed from the continental overview to avoid turning the map into a settlement directory.

## Current continental markers

- **Great House seats and principal strongholds:** Frosthold, Aurelith, Stoneguard, Valedorn, Khar-Dum, Dragonstone, and Tidemark.
- **Other major fortified or strategic places:** Greywatch, Deepwatch, and Eastwatch.
- **Major ports:** Tallowmere, Ironharbor, Deltaport, Stormhaven, and Duskport.

All 15 are intended as public-knowledge locations, subject to GM review of placement and wording. The 15 coordinates were merged from the GM atlas export dated 2026-11-06 and visually reviewed against the authoritative artwork. They remain normalized artwork positions, not surveyed geographic coordinates.

## Route overlays

Six route overlays are now drafted in the live layer: Northern Road, Western Mountain Road, King's Road, Eastern Coastal Road, Southern Trade Road, and Inland Sea Route. The five overland lines connect major places through broad terrain corridors; the Inland Sea Route remains a maritime line. These are editable draft courses and should receive GM review in the app before final campaign use.

## Overlay decision

The previous seven polygon drafts have been removed from the import layer. They mixed political spheres, geographic regions, maritime influence, and the fragmented Southern Reaches. Several Great House polygons overlap. Because exact borders are unresolved, those overlaps must not be presented as sovereign territorial claims or silently explained as wars.

No political polygons have been created. Thirteen broad geographic polygons are present as GM-only drafts and have not been promoted to player visibility. The route overlays are separate line features and do not imply territorial ownership. The new classification and drawing rules are in `atlas_overlay_standards.md`. In brief:

- Political territories: distinct, adjoining, and non-overlapping unless a specific disputed claim or war is approved as canon.
- Geographic regions: may cross political borders and should use a separate visual treatment.
- Maritime influence: a sea-based influence or naval sphere, not land sovereignty over every shore.
- Southern Reaches: three distinct broad zones (Southwestern Marches, Southern Principalities, Southern Islands), with fragmented political authority rather than one unified realm.

The absence of political and maritime overlays is deliberate. Thirteen geographic region drafts exist in the repository layer with `player_visible:false`; they are broad illustrative extents pending GM review, not approved boundaries. An honest unfinished map is better than a confident map that accidentally starts three wars.

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

Tallowmere is on the northwestern shore of the central inland sea, at the mouth of the River Vale. Its current GM-saved continental anchor is X=47.0993%, Y=29.3538%; Dragonstone's is X=58.4224%, Y=38.1772%. These normalized image positions were copied from Supabase on 2026-11-06 and remain pending visual review. They are cartographic positions, not surveyed coordinates.

Intended hierarchy:
1. Continent map: major public places.
2. Tallowmere regional map: nearby settlements, minor houses, roads, crossings, and natural landmarks.
3. Tallowmere city map: districts, gates, streets, civic buildings, and local sites.

The regional map should be a child map of Tallowmere's linked location. The city map should be a child of the regional map. Preserve breadcrumbs back to the continent.

## Coordinate calibration aid

The app atlas provides an optional **coordinate grid** for visual calibration. It uses the same normalized image-space convention as the campaign layer files:

- X=0% at the left edge and X=100% at the right.
- Y=0% at the top edge and Y=100% at the bottom.
- The grid is a visual calibration aid, not surveyed latitude/longitude.
- The app also reports the current pointer position while the grid is enabled.
- Coordinates remain attached to the artwork canvas, so they stay aligned while the map is panned or zoomed.

Use the grid when placing or reviewing markers and overlay points. Do not convert the grid into geographic mileage unless the artwork has been separately calibrated to an authoritative scale.

## Synchronization and ownership

The GM atlas synchronization control reads the `layers` array in this repository file and previews the differences before applying them. `map_source_id` and each marker/overlay `source_id` are stable keys: retain them when names change, and do not reuse retired identifiers. A unique map name/type match is used only to register a layer the first time; later runs use the persisted map source ID. A unique legacy marker/overlay name can adopt an existing record, but ambiguous matches block synchronization for GM review.

The repository owns marker/overlay identity, names, types, coordinates, public location descriptions, and explicitly declared visibility. App-only GM notes, discoveries, and other linked campaign records are not synchronized. Removing a source marker removes only that map marker; its campaign location and lore remain. Removing an overlay removes only the overlay. Destructive map-object removals require explicit GM confirmation, and an applied synchronization can be rolled back.

Only player-safe descriptions belong in this public layer. GM notes are kept in the application and are never inferred from or exposed through a public marker. `player_visible` is explicitly declared for each source marker and overlay; hidden marker types may not be marked public.

For another map, add a corresponding layer object with a unique `map_source_id`, `map_name`, and `map_type`. Set `parent_map_source_id` to the stable source ID of its parent map (or `null` for a root). The parent must already exist in the campaign map library; synchronization validates player visibility and prevents hierarchy cycles, updating the association without deleting map records or changing app-only data.

## Authority

The continental artwork is the authoritative geographic reference. Its coastline and broad geographic features are fixed unless the GM explicitly approves a revision. Regional and city maps must fit the master atlas, not the other way around. See `continent_reference.md`.


## Geographic region draft overlays — 2026-11-06

Thirteen geographic overlays have been added as GM-only illustrative polygons: Northern Wilderness; Northern Mountain and Forest Systems; Western Highlands; Western Forests; Western Heartlands; Central Plains; Central Inland Sea; Northeastern Mountain System; Eastern Forests; Eastern River Delta; Southwestern Marches; Southern Principalities; and Southern Islands. They are broad cartographic regions traced against the authoritative artwork, not surveyed boundaries. Geographic overlays may overlap one another and may cross future political borders. The Central Inland Sea polygon identifies the waterbody; it does not alter the authoritative coastline. All thirteen remain hidden from players pending GM review.
