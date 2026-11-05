# Atlas Overlay Standards

**Status:** GM-approved cartographic working rules  
**Applies to:** Continental and regional atlas overlays

These standards prevent the atlas from implying political facts that have not been established. A polygon is not decorative: players will read it as a claim about who rules a place.

## 1. Political territories

Use a political overlay only when the territory of a crown, Great House, principality, or other recognized authority is being represented.

- Political territories must not overlap by default.
- Borders should adjoin where territories meet; avoid gaps that imply unclaimed land unless that is intended.
- Follow established geography, watersheds, ridgelines, rivers, roads, and recognized jurisdictional boundaries where the canon supports them.
- Do not invent border wars, occupations, disputed claims, enclaves, or buffer states to explain polygon intersections.
- If a dispute or war is later approved, show it explicitly with a separate disputed/occupied treatment and a dated GM note. Do not quietly overlap two normal territory fills.
- A Great House's sphere of influence, trade network, or naval reach is not automatically its sovereign territory.

The six Great Houses have broad territorial frameworks, but exact borders remain unresolved. Their political polygons are therefore withheld until the boundaries can be traced against the authoritative map and approved.

## 2. Geographic regions

Geographic overlays identify physical or cultural regions, not ownership.

Examples include mountain systems, forests, plains, river basins, uplands, marshes, peninsulas, and broad climate zones.

- Geographic regions may cross political borders.
- Their visual style must be distinct from political territory fills: prefer restrained hatching, boundary strokes, or low-opacity neutral shading.
- Name the physical feature, not the ruling house.
- Do not imply that a geographic region is a single political unit.

## 3. Maritime influence

Maritime influence is a sea-based category.

- Show sea lanes, naval reach, patrol waters, or a recognized maritime dominion on the water itself.
- Do not use a sea overlay to imply ownership of every settlement on the coast.
- Keep coastal political territories separate from maritime influence.
- Kharadorn's Central Inland Sea dominion is a maritime sphere. It does not mean every shoreline settlement is directly administered by House Kharadorn.
- Merrowen's maritime reach does not imply control of every eastern port.

## 4. Fragmented southern regions

The Southern Reaches are not one kingdom or unified state. Keep three broad geographic zones distinct:

- **Southwestern Marches:** arid highlands, dry valleys, plateaus, and oases.
- **Southern Principalities:** fertile lowlands, forests, rivers, small hereditary kingdoms, and independent cities.
- **Southern Islands:** island chains, sheltered harbors, fishing settlements, and maritime principalities.

These are broad regional labels. They do not settle the exact borders, names, or allegiances of the individual southern polities.

## 5. Routes and other overlays

Routes should represent established roads, navigable trade routes, sea lanes, or explicitly proposed routes. Do not draw a route as established merely because two places need a connection. Use a different style for proposed or uncertain routes.

## 6. Required metadata before an overlay is imported

Each overlay should have a GM record containing:

- Name
- Category: political, geographic, maritime, or route
- Canon status: established, approved broad framework, provisional, or unresolved
- Description of what the shape means
- Whether it is player-visible
- Source document supporting it
- Whether its boundary is exact, approximate, or illustrative
- Any known exceptions, disputed claims, or uncertainty

The current app's overlay schema stores only a generic region/route type, points, color, and visibility. Until the schema is expanded, keep the richer category and canon metadata in the accompanying map documentation and use unmistakable names/styles. Do not add unsupported enum values to the importer.

## 7. Current hold

The seven original continental polygon drafts were removed from `atlas_player_layer.json` because they mixed categories and several political-looking polygons overlapped. They are not canon borders. No replacement political polygons should be imported until their non-overlapping boundaries have been mapped against the authoritative artwork and approved.
