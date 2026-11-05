# Tallowmere Regional Map: Public Places and Landholder Layer Plan

**Status:** Canon-based content plan; marker coordinates pending placement against the approved regional artwork  
**Parent location:** Tallowmere  
**Map role:** The regional layer between the continental atlas and the city map

The regional map should show the places that matter to everyday travel, local politics, trade, and security around Tallowmere. It should be more detailed than the continental atlas without attempting to label every farm, hamlet, or isolated building.

## Player-facing major regional places

These places are established in the regional settlement and geography records. Their existence and general location should be visible to the players from the start because they are meaningful settlements, chartered sites, or recognizable landmarks in the starting region.

| Place | Map treatment | Public-facing description | Authority / allegiance |
|---|---|---|---|
| Tallowmere | Major city marker; opens city/child map | Walled port on the northwestern shore of the Inland Sea, at the mouth of the River Vale. | House Denvor; charter confirmed by House Kharadorn |
| Harthbridge | Market-town marker | Chartered market town and road junction on the South Road, with livestock, produce, and inland trade. | House Velleran |
| Fordmere | Crossing / fortified-site marker | Chartered river crossing with a ferry, toll yard, inn, and stables on the River Vale route. | House Merewick |
| Ashcombe Manor / Ashcombe Hall | Minor noble seat / fortified manor marker | Fortified manor and estate on a rise near the North Road. | House Avenholt, sworn to House Denvor |
| Millhaven | Settlement / mill marker | Grain village and watermill center on the River Vale road, supplying flour and produce to Tallowmere. | Denvor lordship |
| Stonehollow | Quarry settlement marker | Quarry village on the lower Greyback Ridges, supplying common building stone and dressed blocks. | Denvor-chartered quarry rights held by local families |
| Brackenholt | Woodland settlement marker | Woodland and charcoal settlement supplying fuel, poles, and rough timber. | Denvor lordship with customary household woodland rights |
| Saltwick | Shore settlement marker | Fishing and net-making village on the Eastern Shore, known for preserved fish and its working landing. | Local freeholders and shore charter; superior jurisdiction unresolved |

These are the primary regional markers. Add smaller hamlets, farms, isolated keeps, and local points of interest only when they become relevant to play or when map readability allows.

## Minor houses and local authorities

### House Denvor
The ruling house of Tallowmere and its immediate lordship. It should be visible through the Tallowmere/Greywatch marker and described in the city and regional records. Denvor authority covers Tallowmere and a modest surrounding territory, not every neighboring settlement.

### House Avenholt
Holds Ashcombe Manor under House Denvor.

- Current head: Lady Ysabet Avenholt.
- Heir: Ser Corvin Avenholt.
- Arms: white ash tree above a black plough on a muted red field.
- Words: “Rooted Through Winter.”
- Player-facing map note: a small but established noble house holding a productive manor and tenant lands north of Tallowmere.
- Do not imply that its small garrison can challenge Tallowmere.

### House Merewick
Holds the hereditary charter for Fordmere crossing.

- Current holder: Sir Davren Merewick.
- Player-facing map note: the Merewicks administer the crossing, ferry, and toll rights. Their charter is recognized within the wider Kharadorn sphere.
- Fordmere is not a Denvor possession and should not be colored as Denvor territory.

### House Velleran
Holds Harthbridge under a town charter.

- Current head: Lord Beric Velleran; Lady Maud is also established in the regional record.
- Arms: gold key crossed with a silver sheaf on a dark blue field.
- Words: “The Road Remembers.”
- Player-facing map note: a locally influential minor house with a compact territory and useful charter rights. Harthbridge is a commercial rival to Tallowmere, not automatically an enemy.
- Do not color Harthbridge as Denvor territory.

### House Relland
A minor house under House Velleran, with a manor and tenant lands along the South Road.

- It may be included in GM regional layers and local political notes.
- Whether its manor should receive a player-visible marker depends on the final regional map scale and whether the manor is a recognized public landmark.
- Public material may identify House Relland as a local vassal family if that information is appropriate to the campaign's starting knowledge.
- Keep the historical murder of the travelling merchant family, the ratfolk PC's family connection, and all related concealed information GM-only. Never place those facts in player-facing descriptions, marker names, tooltips, or public notes.

### Saltwick's shore charter
Saltwick's superior jurisdiction is unresolved. Do not assign it to House Denvor, Velleran, or Merrowen without a GM decision. Show the local freeholders and shore charter as its current authority.

## Geographic and route markers

The regional map should also include, where the approved artwork permits:

- River Vale and its main course.
- Brackenwood and the Greyback Ridges.
- Northfields and Eastern Shore.
- North Road, River Vale Road, Western Track, Quarry Road, Eastern Shore Road, and King's Road / South Road.
- Old Stone Bridge, Mill Bridge, and Fordmere Crossing.
- The Long Mill, Three Faces, Burners' Green, Ashcombe Rise, Merewick Yard, Saltwick Beacon, Bellwater Pool, and the other established regional landmarks.

Do not add a permanent bridge where the geography record does not establish one. Millhaven Mill Weir is not a public road bridge. Do not invent new roads or crossings to make the map look complete.

## Visibility rules

**Visible from campaign start:** Tallowmere, Harthbridge, Fordmere, Ashcombe Manor, Millhaven, Stonehollow, Brackenholt, Saltwick, established roads/crossings, and major natural landmarks.

**May be visible as minor labels or GM-selectable:** smaller hamlets, scattered farms, local manors, and secondary landmarks.

**GM-only:** concealed sites, secret routes, the House Relland crime and its connection to a player character, private intelligence, and any undiscovered adventure locations.

## Stable source IDs and synchronization preparation

The regional content registry at `campaign/maps/tallowmere_regional_content_spec.json` assigns stable source IDs to the eight public regional settlements, five major geographic features, six established road connections, and three public landmarks. These IDs are intended to survive later conversion into live atlas markers and overlays.

Use the canonical campaign location source IDs for settlement markers: `tallowmere`, `harthbridge`, `fordmere`, `ashcombe-manor`, `millhaven`, `stonehollow`, `brackenholt`, and `saltwick`. This prevents duplicate campaign locations when the same settlement appears on multiple map layers.

The regional registry deliberately does not contain fake x/y coordinates. The approved regional illustration is the relative-placement reference, but its printed scale is unreliable and its artwork is not currently stored under `campaign/maps/`. Once the artwork is available, calibrate the image, place the markers, trace established routes, and then create a live synchronization layer. Do not synchronize placeholder coordinates.

## Coordinate and import safeguards

No marker coordinates are supplied in this plan. Place markers only after comparing the actual regional map artwork with the written geography. The regional geography document takes precedence over approximate printed scale bars. Preserve the stated relative arrangement and written journey distances; do not infer exact coordinates from prose alone.

The current importer does not support separate player descriptions and GM notes in one marker record. Until that is improved, use only safe public descriptions in imported marker descriptions and keep secrets in the GM lore database, not in the marker payload.
