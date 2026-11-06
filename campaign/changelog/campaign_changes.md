## 2026-11-06 - Campaign bestiary foundation

- Added `campaign/creatures/Creature_Registry.md` as the campaign source index for creatures, supernatural beings, and regional ecology.
- Established evidence/status and ecology vocabularies to distinguish canon, direct observation, documentation, reports, rumors, prepared encounters, and unresolved mysteries.
- Added a reusable creature-record template and requirements for future in-app bestiary data, including stable IDs, regional occurrence, source references, and separate public/GM knowledge.
- Registered only existing material: the prepared but not-yet-encountered troll, the established historical dragons of the fallen dynasty, and vampirism as an established condition with unresolved origins and ecology.
- Did not add unapproved creature species, invent regional populations, assign unsupported rarity, or resolve the fate of dragons or origins of vampirism.

## 2026-11-06 - Atlas child-map navigation and map identity cleanup

- Added a contextual **Open child map** action when a selected marker is linked to a child map under the current map and the child map points to the same campaign location.
- This supports the intended Tallowmere path: continental Tallowmere marker → Tallowmere regional map → regional Tallowmere marker → Tallowmere city map.
- Corrected the existing Supabase city map display name from the typo `Tallomere` to `Tallowmere City`; retained its UUID, stable source ID, artwork, parent, location association, and player visibility.
- Verified the live map hierarchy remains Continent → Tallowmere Region → Tallowmere City.
- No artwork, marker coordinates, routes, or political geometry were changed in this step.

## 2026-11-06 - Live atlas map identity and coordinate export

- Added stable repository map source IDs to the existing Supabase regional and city map records: `tallowmere_regional` and `tallowmere_city`. Existing UUIDs, artwork paths, location links, visibility, and parent-child hierarchy were preserved.
- Added a stable source ID to the existing regional Tallowmere marker: `tallowmere_regional/tallowmere`; its saved coordinates and public visibility were unchanged.
- Updated the atlas data model and marker loader to expose stable source IDs to the GM interface.
- Added **Export calibrated coordinates**, which downloads a coordinate-only patch for source-identified markers and leaves canonical repository files untouched.
- Documented the export safeguards and synchronized the continent reference/player-layer notes with the GM-saved Tallowmere and Dragonstone positions.
- No regional coordinates, routes, borders, or unverified geometry were invented or promoted.

## 2026-11-06 - Tallowmere regional artwork integrated

- Added the newly uploaded regional artwork as campaign/maps/tallowmere_regional.png using the original image blob without altering the artwork.
- Removed the root-level upload copy Tallowmere_ City of the Vale Map.png after verifying the replacement path and exact blob.
- Updated campaign/maps/tallowmere_regional_content_spec.json to record the artwork as present while keeping all coordinates pending visual calibration.
- Updated campaign/maps/atlas_layer_registry.json to register the regional artwork path and retain the non-live calibration status.
- Updated map documentation to distinguish artwork integration from coordinate calibration.
- No regional markers, routes, polygons, political boundaries, or other geometry were invented or promoted into the live player layer.

## 2026-11-06 - Tallowmere city calibration plan

- Added `campaign/maps/tallowmere_city_layer_plan.md` as the working cartographic plan for the city map.
- Enumerated only city features already established in campaign canon: Greywatch, named districts, gates, established routes, harbor/river geometry, and defensive context.
- Explicitly withheld city coordinates, district polygons, road paths, wall geometry, and Underways access points until the artwork can be visually calibrated.
- No new lore or map geometry was invented.
- The city artwork remains in `campaign/maps/tallowmere_city.png`; the next live-layer step is artwork calibration followed by stable marker coordinates and reviewed synchronization.

## 2026-11-05 - Tallowmere city map library integration

- Moved the GM-approved city artwork from the repository root to `campaign/maps/tallowmere_city.png`.
- Removed the root-level copy from the current branch tree; the original upload remains in Git history.
- Updated `campaign/maps/atlas_layer_registry.json` to record the canonical artwork path and pending cartographic review.
- Updated map library documentation. No city markers, districts, roads, or overlays were invented or promoted into the live sync layer.
- The approved regional illustration is still not present in the map library; regional geometry remains blocked pending artwork integration and calibration.

## 2026-11-05 - Tallowmere regional artwork canonized

- Promoted **The Lands About Tallowmere** from approved visual reference to the canonical visual reference for the broad relative geography around Tallowmere.
- Canonized the artwork's relative arrangement of Tallowmere, River Vale, Millhaven, Fordmere, Brackenholt, Brackenwood, Stonehollow, Greyback Ridges, Northfields, Ashcombe Manor, Saltwick, Harthbridge, and surrounding terrain.
- Preserved the established written travel distances as authoritative because the artwork's printed 0–100 mile scale bar conflicts with those distances and is not canon.
- Kept the Tallowmere city map uncanonized pending correction/review of the previously identified walls, Underways, named landmarks and streets, coastline/river details, and Greywatch scale/presentation.

## 2026-11-05 - Atlas repository synchronization and regional map preparation

- Refined `campaign/maps/atlas_player_layer.json` as the canonical continental player layer with stable source/location linkage and explicit coordinate safeguards.
- Confirmed the continental source remains limited to 15 major public places and zero polygon overlays until political/geographic boundaries are properly classified and approved.
- Added `campaign/maps/tallowmere_regional_content_spec.json` as a structured, non-live regional content registry for Tallowmere.
- Registered stable source IDs for the eight established public regional settlements, five major geographic features, six established road connections, and three public landmarks.
- Preserved the established written travel distances and political relationships.
- Explicitly withheld regional x/y coordinates because the approved regional artwork is not currently stored in the repository and its printed scale bar is not authoritative.
- Kept House Relland's historical crime and player-character connection GM-only.
- Updated map documentation to distinguish repository content preparation from live atlas synchronization.

# Campaign Changes

## 2026-11-05 - Continent atlas layer import
- Added a GM atlas import for `campaign/maps/atlas_player_layer.json`.
- Import creates missing campaign locations, links map markers to locations, and adds the prepared region overlays; existing same-name map markers and overlays are not overwritten.
- New locations, markers, and overlays remain GM-only until the GM reviews and explicitly shares them, preserving the atlas's approximate placements and unresolved boundaries.
- Updated the map library instructions and atlas layer review workflow. No player visibility or geographic canon was changed by adding the import.

## 2026-11-03 - Initial campaign repository organization
- Preserved the uploaded Campaign Bible DOCX and continent atlas PNG in `campaign/`.
- Added and retained the Markdown working copy of the Campaign Bible.
- Added a canon register, current world state, world history outline, calendar placeholder, and current worldbuilding direction.
- Added record indexes for geography, politics, people, factions, religions, creatures, maps, economy, player characters, world events, and source material.
- Confirmed the continent atlas remains provisional.
- Flagged the conflict between the imported high-medieval/no-steampunk Bible and the newer grimdark gothic/industrial brainstorming.
- No unresolved setting details were promoted to established canon.

## 2026-11-03 - High-medieval technology confirmed
- GM explicitly confirmed the setting is high-medieval.
- Industrial and steampunk technological culture are excluded.
- Alchemy remains a specialized Pathfinder-based field and does not imply industrialization or advanced machinery.
- Gothic horror, vampires, cults, religious zealotry, and decaying institutions may remain as atmosphere and supernatural content without changing the technological baseline.
- Updated the current worldbuilding direction, canon register, and current world state to reflect this decision.

## 2026-11-03 - Continuity management system established
- Added a Worldbuilding Decision Log to preserve rationale and document superseded decisions.
- Added an Open Questions Register with priorities, including first-session-critical gaps.
- Added a Names & Terminology Index to prevent duplicate names and spelling drift.
- Added a Lore Continuity Checklist for pre-approval reviews and post-session updates.
- Updated campaign record instructions to require provenance, visibility classification, mystery preservation, and checkpoint updates.
- These records formalize process; they do not resolve or invent campaign lore.

## 2026-11-03 - Player characters already know each other
- GM confirmed that the two player characters are already acquainted before Session One.
- Removed their first meeting as an opening-scene requirement.
- The precise history and dynamic of their relationship remain undocumented and must be verified during the lore review rather than inferred.
- Updated the Current World State, Canon Register, Decision Log, and Open Questions Register accordingly.

## 2026-11-03 - World foundation and ancestry audit revisions
- Replaced the former gothic steampunk campaign direction with grounded high-medieval fantasy as the central identity; supernatural horror remains present but is not the main theme.
- Confirmed that the Pathfinder gods are real. Updated divine-magic language so divine spellcasters are uncommon and devote themselves to a god; arcane spellcasters are rare, divine spellcasting is also uncommon, and most ordinary people may never witness a spell.
- Corrected the dwarven history: the dwarven empire has always existed and has never collapsed or been especially massive. Dwarves primarily inhabit mountains and underground settlements and rarely live in conventional surface stone-built settlements.
- Recorded dwarven cultural endogamy as a matter of pride and choice, not established biological incompatibility.
- Confirmed that elves possess a major political power and that one Great House is an influential elven dynasty.
- Updated ratfolk prejudice from limited to widespread across surface societies, while preserving a few tolerant or accepting communities.
- Confirmed that other Pathfinder ancestries may exist without rare/uncommon designation in this human-dominated setting.
- Updated the Campaign Bible, Canon Register, Current World State, Worldbuilding Direction, Decision Log, and Open Questions Register. The uploaded DOCX remains preserved as historical source material and was not overwritten.

## 2026-11-03 - Dwarven imperial structure
- Established that the dwarven empire consists of several independent clans united under the main branch of dwarves.
- Established that the main branch occupies Dragonstone and is said to descend from Torag himself; the descent remains a dynastic claim or tradition rather than confirmed divine ancestry.
- Clarified that the dwarven Great House is associated with this main branch.
- Updated the Campaign Bible, Canon Register, Current World State, Worldbuilding Direction, Decision Log, and Open Questions Register.

 
## 2026-11-03 - Great Rebellion and dragon dynasty history confirmed
- GM confirmed the previously questioned historical details: approximately 400 years of Targaryen rule; exactly twelve dragons at the dynasty's height; exclusive bloodline-based dragon bonding; one dragon per rider; telepathic rider-dragon bond; and the established interpretation of dragons as enormous flying reptilian predators rather than traditional Pathfinder dragons.
- Confirmed that six Great Houses rebelled for two connected objectives: preserve their political independence against Targaryen centralization and eliminate dragon-riding as the foundation of Targaryen political and military supremacy.
- Confirmed the multi-year rebellion, dwarven leadership, specialized dragon-slaying ballistas, deaths of most dragons, destruction of nearly the entire Targaryen ruling family, fall of the Imperial Seat, transfer to a different dynasty, and dwarven claim to Dragonstone.
- Confirmed that one nine-year-old Crown Prince survived the destruction of Dragonstone; his survival remains concealed and his personal name belongs to the player.
- Expanded `World_History.md` from a provisional outline into an established historical foundation while keeping exact dates, original names, individual house roles, detailed campaigns, and the postwar settlement unresolved.
- Updated the Campaign Bible's statement of the rebellion's dual objectives and synchronized the Canon Register, Current World State, Decision Log, and Open Questions Register.

 
## 2026-11-03 - Post-rebellion ruling sequence clarified
- GM confirmed that the dwarven leader and the Baratheon-inspired house held power following the fall of the Targaryen dynasty.
- Established that a different major house later took the Imperial Seat and is the current ruling house.
- The current ruling house's identity, the length and exact form of the dwarven-led rule, and the circumstances of the transfer remain unresolved.
- Updated the World History, Campaign Bible, Canon Register, Current World State, Decision Log, and Open Questions Register.


## 2026-11-03 - Dwarven succession crisis and transfer of the Imperial Seat
- GM confirmed that the same dwarven leader ruled for more than a century after the Great Rebellion and remained in power until his death.
- His successor inherited his authority, but a succession crisis followed.
- The dwarven successor threatened war unless a human was placed on the Imperial Seat.
- Another of the original six rebel Great Houses took the throne and became the current ruling dynasty; the dwarven successor retained the inherited authority of the dwarven order.
- The identity of the ruling house and the precise chronology and events of the crisis remain unresolved.
- Updated `World_History.md`, `Campaign_Bible.md`, `Canon_Register.md`, `Current_World_State.md`, `Worldbuilding_Decision_Log.md`, and `Open_Questions_Register.md`.


## 2026-11-03 - Compromise monarch and dwarven-human uneasy peace
- GM clarified that the human placed on the Imperial Seat was the head of the Great House that now rules, but only as a compromise candidate; he is a puppet monarch.
- The dwarven successor reluctantly accepted the arrangement, returned to Dragonstone, and continued ruling the dwarven clans.
- Established an uneasy peace marked by mutual distrust between the dwarven empire and the human monarchy. War would not favor the dwarves, but they are not afraid of it.
- The identity of the ruling house and the person or powers controlling the puppet monarch remain unresolved.
- Updated `World_History.md`, `Campaign_Bible.md`, `Canon_Register.md`, `Current_World_State.md`, `Worldbuilding_Decision_Log.md`, and `Open_Questions_Register.md`.


## 2026-11-03
- Recorded the monarch's legitimate family claim and substantial but constrained authority.
- Recorded influence by a Great House council or coalition and multiple competing factions.
- Recorded that the other rebel houses seek to manipulate the throne for their own interests.
- Specific faction identities and influence remain unresolved.


## 2026-11-03 — Six Great Houses approved; Khar-Dum and Dragonstone distinguished
- GM approved the six Great House proposals, including their names, core identities, words, sigils, political aims, differing rebellion motives, and relationship matrix:
  - House Vaelorian — elven commercial and financial dynasty.
  - House Kharadorn — dwarven Great House associated with the main branch of the enduring dwarven empire.
  - House Edarth — primarily human landed and martial house.
  - House Calderan — human ruling dynasty with an older legitimate hereditary claim to the Imperial Seat.
  - House Veyr — human northern dynasty maintaining the Ancient Barrier.
  - House Merrowen — primarily human maritime and naval dynasty.
- Clarified that Khar-Dum is the Kharadorns' ancestral homeland.
- Clarified that Dragonstone was the ancestral stronghold of the fallen dragon-riding dynasty. The dwarves acquired it through conquest during the Great Rebellion; it is not their ancestral homeland.
- Recorded the approved Imperial Council concept and competing political factions while leaving their exact membership and leadership unresolved.
- Updated the Campaign Bible, Canon Register, Current World State, World History, Worldbuilding Direction, Decision Log, Names & Terminology Index, and Open Questions Register.

- Confirmed House Kharadorn as the original name replacing the dwarven Great House's legacy House Baratheon placeholder. Khar-Dum is the ancestral homeland; Dragonstone is the conquered former Targaryen stronghold.


## 2026-11-03 — Stage 5 geography foundations approved
- GM approved a vast continent substantially larger than Westeros, following the larger scale implied by the provisional atlas. Exact dimensions and travel distances remain unmeasured.
- Retained the enormous central inland sea.
- Established Dragonstone as an island within the inland sea, connected to the mainland by a narrow natural land bridge. This is the only known surface route onto or off the island without dragons.
- **GM-ONLY SECRET:** Established that the dwarves have constructed an underground tunnel system providing another route to and from Dragonstone. The rest of the world does not know it exists. Exact route, entrances, extent, construction history, and who knows of it remain unresolved.
- Placed Khar-Dum, the Kharadorns' ancestral homeland, in the northeastern mountain system, separate from Dragonstone.
- Established that each Great House controls a substantial, clearly defined territory, while smaller noble houses, independent settlements, and lesser political powers also exist.
- Updated the Campaign Bible, Canon Register, Current World State, Worldbuilding Direction, Decision Log, Open Questions Register, Names & Terminology Index, and Development Roadmap.
- The atlas remains provisional for exact terrain, labels, scale bar, borders, and placements. Detailed territorial geography remains the next task.

## 2026-11-03 — Revised continental scale and minor-house structure
- Replaced the earlier larger-than-Westeros direction with approved working dimensions of approximately 1,700 miles north to south and 1,300 miles east to west at the widest point. Modest adjustment is permitted during map refinement; the previous atlas scale bar is superseded.
- Confirmed that the revised map should preserve the atlas's recognizable geographic identity while making terrain and waterways coherent.
- Confirmed the central inland sea should support substantial regional shipping and naval commerce, the southern reaches should remain politically fragmented, and the dwarven empire should appear comparatively limited on the surface with its true reach primarily subterranean.
- Established minor houses as wealthy lords and ladies with small territories and local holdings but little continent-wide political significance. Their names, number, holdings, and allegiances remain unresolved.
- Kept the specific proposed regional placements of the six Great Houses provisional pending review of the revised map.
- Updated the Campaign Bible, Canon Register, Current World State, Worldbuilding Direction, Decision Log, Open Questions Register, Names & Terminology Index, and Development Roadmap.


## 2026-11-04 — Campaign lore library organization
- Moved the world-history and calendar records into `campaign/history/`.
- Moved Great House rulers, the Imperial Council and Royal Court, and the House Relland incident into `campaign/politics/`.
- Moved the detailed religion reference into `campaign/religions/`.
- Moved player-character background and opening-preparation records into `campaign/player_characters/`.
- Moved the original Campaign Bible, world-atlas/simulator document, and character-sheet PDF into `campaign/source_material/` without altering their contents.
- Added navigation records for the history library, location dossiers, and Tallowmere's local reference collection.
- Corrected geography and source-material instructions to point to the current authoritative atlas at `campaign/maps/continent_atlas.png`.
- Updated the campaign directory index and subject-folder guidance. No lore was rewritten or promoted to canon as part of this organizational change.

## 2026-11-06 - Atlas scale separation, regional roads, and territory framework

- Confirmed the continental atlas is a major-place overview only; minor and regional settlements belong on their relevant regional maps.
- Added a route-tracing plan for the six established Tallowmere regional roads, including the River Vale Road's intermediate connection through Millhaven to Fordmere.
- Added structured local authority records for Houses Denvor, Avenholt, Velleran, Merewick, Saltwick's freeholders, and Kharadorn's strategic and charter role.
- Distinguished direct territorial control, vassal holdings, charter rights, and strategic interests so they are not mistakenly rendered as identical political polygons.
- Updated overlay standards to prioritize established road traces, then provisional Great House boundary drafts, with GM approval before player publication.
- No route coordinates, territory polygons, or unsupported borders were invented or promoted to the live atlas. Exact regional and continental border geometry remains a cartographic decision requiring artwork review and GM approval.

## 2026-11-06 - First-session player materials and calendar established

- Added `campaign/player_materials/Player_Starting_Handout.md`, a player-facing guide based only on established public campaign canon. It covers the six Great Houses, the current monarchy, the 15 major continental places, Tallowmere, its immediate regional communities, roads, religion, magic, and starting circumstances.
- Established the working calendar in `campaign/history/Calendar.md`: 12 thirty-day months, five Yearturn days, a leap day every fourth year, a seven-day week, variable seasons, and the AC/BC dating convention.
- Set the campaign opening date to **1 Harvestfall, 243 AC**.
- Added `campaign/history/Campaign_Timeline.md` as a chronological framework. Historical events remain approximate where exact dates are not established.
- Updated the Session One GM packet, current world state, and open-questions register to reference the handout and campaign date.
- Corrected the obsolete description of the current monarch as a puppet in `World_History.md`; current canon gives King Aldric a legitimate hereditary claim and substantial formal authority, constrained by the Great Houses and court factions.
- Flagged the duplicate use of **Greywatch** for the northern Veyr-associated place and House Denvor's seat in Tallowmere. No rename or map change was made.
- Character sheets, backstories, companion approval, encounter balancing, and end-to-end player-permission testing remain outstanding.

## 2026-11-06 - Superseded monarch characterization reconciled across lore

- Reconciled older references that called the current monarch a puppet with the 2026-11-04 GM-approved canon: King Aldric Calderan has a legitimate hereditary claim and substantial formal authority, while the Great Houses and court factions constrain his practical freedom.
- Updated the Campaign Bible, World History, Canon Register, and Worldbuilding Decision Log. The decision log preserves the older wording as a superseded historical record rather than current canon.
- No single controller of the monarch is established.


## 2026-11-06 — Player backstories and world-knowledge handout updated

- Recorded the vampire PC's promise that helping restore the fallen Targaryen dynasty could create substantial opportunities for the ratfolk PC to advance his own goal of ending persecution and improving ratfolk standing. The promise is potential, not a guaranteed outcome or predetermined political reward.
- Clarified the shared relationship as friendship and mentorship while preserving both PCs' independent ambitions and player agency.
- Updated the player starting handout with the established public history of the Great Rebellion, the broad structure of hereditary and Great House power, and the campaign calendar/current date.
- Kept the vampire PC's survival, royal identity, captivity, and personal history out of player-facing world material. No unresolved historical dates, dynasty names, or political outcomes were invented.


## 2026-11-06 - Creature dossier and reusable record template

- Added `campaign/creatures/Creature_Record_Template.md` to standardize creature, ecology, evidence, knowledge, and change-history records.
- Added `campaign/creatures/Troll.md` as a GM-only dossier for the provisional Session One troll encounter. It preserves the standard Pathfinder First Edition troll baseline and makes clear that the planned encounter does not establish a local troll population.
- Linked both records from the creature folder index and the campaign-wide creature registry.
- No new creature distribution, local folklore, or regional ecology was established. The troll's exact encounter location and outcome remain pending play.
- Confirmed that the current campaign JSON importer does not yet support creature records; no unsupported creature import package was created.


## 2026-11-06 - Table-side GM support and regional creature tracking

- Added `campaign/Table_Side_GM_Support_Protocol.md`, documenting the assistant's role during live play, rules support, encounter construction, improvisation, state tracking, and post-session repository updates.
- Added `campaign/creatures/Regional_Occurrence_Template.md` to track regional creature evidence without turning a single sighting into an unsupported population claim.
- Updated campaign and creature indexes and the development roadmap. The GM remains final authority; proposed improvisations are not canon until approved.


## 2026-11-06 - Living World Engine and Tallowmere ecology foundation

- Added `campaign/Living_World_Engine.md`, a GM-reviewed framework for autonomous actors, ongoing issues, projects, events, time advancement, political and economic consequences, succession, border disputes, and player agency.
- Added `campaign/world_engine/Actor_Register.md` and `Initial_Issue_Register.md`. The issue register records the seven existing Tallowmere pressures from the Session One GM Readiness Packet without inventing causes, secret connections, or outcomes.
- Added `campaign/creatures/Tallowmere_Regional_Ecology.md`, documenting established habitats and ecological constraints while keeping unapproved species and populations unconfirmed.
- Updated campaign and creature indexes and the development roadmap. No assassination, active border war, new political claim, or regional monster population has been established by this work.


## 2026-11-06 — Tallowmere political simulation layer

- Added campaign/world_engine/Regional_Holdings_and_Jurisdictions.md, consolidating the established jurisdiction and charter relationships for Tallowmere, Millhaven, Brackenholt, Stonehollow, Ashcombe Manor, Fordmere, Saltwick, Harthbridge, and House Relland's holding. Exact borders and unresolved superior jurisdictions remain open.
- Added campaign/world_engine/Tallowmere_Political_Actor_Dossiers.md, with source-grounded profiles for House Denvor, Avenholt, Velleran, Merewick, Relland, the Kharadorn Charter House, and the Chartered Council.
- Expanded Initial_Issue_Register.md with named established participants, known positions, unknowns, possible paths, and regional friction points. Confirmed no active territorial border war or named-house border dispute in the starting region.
- Added Initial_Project_Register.md for the existing harbor-defense review, warehouse safety effort, ratfolk market-access advocacy, harbor allocation, harvest monitoring, and Denvor defense deliberations.
- Updated actor, campaign, local-location, and roadmap indexes. No new houses, border geometry, troop counts, debts, secret conspiracies, or political outcomes were invented.


## 2026-11-06 — Great House simulation and world-turn templates

- Added campaign/world_engine/Great_House_Actor_Dossiers.md, consolidating established strategic agendas, internal tensions, relationships, leverage, and constraints for all six Great Houses.
- Added World_Event_Record_Template.md and World_Turn_Report_Template.md for consistent event history and GM-reviewed time advancement.
- Established that no world turn has yet been run; campaign date remains 1 Harvestfall, 243 AC. No assassination, new war, or new Great House project was introduced.
