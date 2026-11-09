## 2026-11-06 — Regional factions and supplemental minor actors

- Added `campaign/world_engine/Regional_Factions_and_Minor_Houses.md` under the GM's explicit delegation to create whatever NPCs, minor factions, and supporting actors are needed for a living world.
- Added five Tallowmere-hinterland organizations: the River Vale Millers, Brackenwood Charcoal Fellowship, Stonehollow Quarry Compact, Saltwick Shore Compact, and Tallowmere Warehouse Guild.
- Added supplemental minor Houses Corven and Calderick outside the calibrated Tallowmere map. House Calderick has a deliberately local succession uncertainty; no wider succession crisis is established.
- Reconciled existing NPC records so Harlan Tebb and Meret Sorn are referenced rather than duplicated.
- Updated the Current World State and Actor Register. No exact borders, troop counts, treasury figures, or new armed conflicts were created.

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


## 2026-11-06 — Feudal law and continental project foundations

- Added `campaign/politics/Feudal_Law_and_Landed_Obligations.md` to establish a consistent working framework for Crown authority, Great House territories, banner houses, Crown vassals, independent lords, charter rights, inheritance, courts, customary rights, and political consequences.
- Preserved gender-inclusive inheritance eligibility because established Great House rulers and designated heirs include women; detailed succession customs remain house- and charter-specific.
- Initialized `World_Event_Ledger.md` and `World_Turn_Ledger.md`. Neither records a simulated event or completed world turn.
- Added `Continental_Project_Register.md` with six ongoing, proposed, or watch-level efforts across the Crown, Vaelorian, Veyr, Edarth, Merrowen, and Brightwater.
- Linked the legal framework and project/turn records from campaign indexes. The opening date remains 1 Harvestfall, 243 AC; the first world turn is still pending.


## 2026-11-06 — Tallowmere ratfolk networks and community NPCs

- Added `campaign/locations/starting_city/Ratfolk_Community_Networks_and_NPCs.md` with four informal networks: Cistern Keepers, Open Stall Petition, Underway Couriers, and Quiet Hearths.
- Added Vessa Reedtail, Pellit Quickstep, and Dorrik Sootpaw as named NPCs while preserving the established roles of Nix-of-the-Cistern, Tikka Vell, Serren Coil, and Miraq Ashwhisk.
- Established competing strategies around negotiation, market access, route safety, household protection, and public pressure. No network speaks for all ratfolk.
- Updated the local Underways, faction, issue, actor, names, and Session One references. The ratfolk PC may build relationships and influence but is not the community's automatic leader.


## 2026-11-06 — Tallowmere rumor truth and information control

- Added `campaign/world_engine/Tallowmere_Rumor_Truth_Register.md` to separate objective GM truth from public rumors and NPC knowledge.
- Assigned limited, non-conspiratorial truth to selected rumors: isolated cargo-tally alteration, property-lease inquiries, use of a small service passage, a modest ratfolk-crafted retort, and historical chart purchases tied to Seralyth Vaelorian's commercial review.
- Kept the lost ship, warehouse-fire causes, and noble magical-services rumor unresolved.
- Clarified that the Kharadorn envoy rumor exaggerates the existing legitimate charter review; no additional envoy or expanded demand is established.
- Linked the register from the Tallowmere rumor record, world-engine index, actor register, and names index. The first world turn remains pending.


## 2026-11-06 — Campaign opening readiness checkpoint

- Added `campaign/Worldbuilding_Readiness.md` to define launch-ready criteria and distinguish required foundations from long-term worldbuilding.
- Confirmed the core world-engine foundation is ready for an opening baseline turn on 1 Harvestfall, 243 AC without advancing the calendar.
- Recorded remaining non-blocking work: exact map borders, additional minor-house detail, full regional legal customs, complete ratfolk geography, ordinary wildlife catalogue, and deep historical mysteries.
- Kept Session One combat balance pending completed PC sheets, final companion approval/build, and the actual approach route.


## 2026-11-06 — First world turn completed: campaign opening baseline

- Completed WTR-001 as an approved zero-time snapshot on 1 Harvestfall, 243 AC, recorded in `campaign/world_engine/reports/World_Turn_001_Opening_Baseline.md`.
- Reviewed all seven Tallowmere pressures, the Longmead boundary dispute, six Tallowmere projects, six continental projects, Great House strategic pressures, and the GM-only rumor truth register.
- Confirmed the vampire PC's identity remains secret, the ratfolk PC's survival remains unknown to House Relland, and the Dragonstone underground route remains GM-only.
- No new world-changing event, assassination, war, famine, coup, blockade, or escalation was introduced. No in-world time elapsed.
- Updated the world-turn and event ledgers and current world state. Campaign opens on 1 Harvestfall, 243 AC.
## 2026-11-06 — Opening sandbox and information audit

- Added `campaign/locations/starting_city/Session_One_Sandbox_Reference.md` as a table-side reference for the post-wagon sandbox, immediate consequences, destinations, actor motivations, and no-railroading rules.
- Added `campaign/world_engine/Tallowmere_NPC_Information_Network.md` to define plausible information channels among established civic, commercial, ratfolk, and informal actors without creating an omniscient network or secret master organization.
- Added `campaign/creatures/Regional_Wildlife_Catalogue.md` as a proposed ordinary-fauna catalogue, explicitly separate from established monster populations.
- Corrected duplicate supporting-NPC IDs in `campaign/world_engine/Regional_Factions_and_Minor_Houses.md`.
- Updated the actor index and worldbuilding-readiness record. WTR-001 remains the approved zero-time opening baseline on 1 Harvestfall, 243 AC; no additional world turn was run.


## 2026-11-06 — Consolidated GM reference editions

- Added `campaign/GM_Campaign_Bible.md`, a GM-only consolidated reference for current canon, protected PC truths, geography, Great Houses, Imperial government, history, minor powers, calendar, and Living World Engine procedures.
- Added `campaign/locations/starting_city/Tallowmere_GM_Dossier.md`, a GM-only operational guide to Tallowmere's government, household, NPCs, districts, locations, shops, temples, hinterland, factions, rumors, criminal operators, current issues, and opening session.
- Added navigation links to `campaign/README.md` and `campaign/locations/starting_city/README.md`.
- The consolidated documents preserve unresolved details and defer to dedicated authoritative records; they do not invent map geometry, troop totals, PC statistics, or unapproved outcomes.


## 2026-11-06 — NPC roleplaying dossier collection

- Added `campaign/people/NPC_Roleplaying_Dossiers.md`, a GM-only table-facing collection for established named NPCs across Tallowmere and the wider setting.
- Profiles include immediate and long-term goals, fears, contradictions, social methods, pressure responses, voice cues, sample lines, ways to influence them, suggested Pathfinder alignments, and explicit continuity boundaries.
- Alignment suggestions and behavioral details not established by source canon are labeled as provisional portrayal guidance rather than immutable facts.
- Added navigation from the people, campaign, and Tallowmere indexes.
- Flagged an unresolved name collision: Chief Magistrate Odran Pell and Odran Pell, Elira Pell's father/business partner at Pell & Daughter. No retcon or identity merge was made.
- The dossier collection excludes player characters and leaves the proposed companion and unnamed wagon guards unfinalized.

## 2026-11-09 - Worldbuilding expansion: culture, ordinary life, and holidays

- Added `campaign/cultures/Vaelorian_Culture_and_Homelands.md` with detailed Vaelorian settlement, architecture, homes, family life, clothing, food, commerce, education, religion, death, art, military culture, human relations, and internal cultural tensions.
- Added `campaign/world/Everyday_Life_and_Material_Culture.md` covering ordinary food, preservation, childhood, marriage, death, medicine, illness, clothing, work, money, communication, law, crime, fire, animals, sanitation, entertainment, class, and hospitality.
- Added `campaign/history/Holidays_and_Observances.md` explaining the origins, social meaning, customs, political uses, and regional/class differences of major civil observances.
- Updated `campaign/Cultures_and_Societies.md` to link the detailed records and replace the former simulation-oriented cultural behavior section with GM judgment guidance.
- Updated `campaign/README.md` so the GM reference is no longer described as containing a Living World Engine and the legacy `world_engine/` material is explicitly treated as source material rather than an operating simulation.
- No PC-specific assumptions were added.

## 2026-11-09 - Faith in ordinary life and religious index correction

- Added `campaign/religions/Faith_in_Ordinary_Life.md` covering household worship, temple services, clergy, divine spellcasters, rites of passage, oaths, charity, education, pilgrimage, religious disagreement, and ordinary public faith.
- Corrected `campaign/religions/README.md`: it had incorrectly described the gods' existence as uncertain, contradicting established canon. The gods are real; mortal interpretations and the mechanism of divine magic remain distinct open questions.
- Linked the ordinary-faith reference and existing regional institution dossier from the religion index.
- No new deity, major religious hierarchy, schism, or supernatural mechanism was invented.


## 2026-11-09 — Tallowmere ordinary wildlife and natural history expanded

- Expanded `campaign/creatures/Regional_Wildlife_Catalogue.md` from a short candidate species list into a GM-only natural-history reference for the Northfields, Brackenwood, River Vale, Greyback Ridges, Eastern Shore, and Tallowmere itself.
- Added habitat-specific candidate fauna, human and economic relationships, seasonal expectations, field signs, food-web context, animal care, disease cautions, folklore boundaries, and supernatural safeguards.
- Preserved the catalogue as PROPOSED: plausible species are not confirmed local occurrences, and frequency remains unknown until evidence or explicit GM approval.
- Linked the catalogue from the creature registry and creature folder index. The established Tallowmere habitat baseline was not changed; no new monster population, migration, livestock crisis, or supernatural ecology was established.


## 2026-11-09 — Tallowmere flora and fungi reference added

- Added `campaign/creatures/Tallowmere_Flora_and_Fungi.md` as a proposed GM-only botanical reference for crops, orchards, hedgerows, managed woodland, river margins, quarry scrub, eastern shore vegetation, household gardens, fungi, and useful plant materials.
- Added practical context for seasonal gathering, woodland rights, craft use, food, and the limits of folk medicine.
- Kept all species and local uses provisional; no magical plants, definitive botanical distribution, crop yields, or medicinal cures were established.
- Linked the new reference from the creature and natural-world folder index.


## 2026-11-09 — Living World Engine retired and GM workflow clarified

- Retired the former automated Living World Engine, world-turn cycle, simulation clocks, and procedural event advancement from campaign scope, per GM direction.
- Replaced the engine section of `campaign/GM_Campaign_Bible.md` with a GM-judgment approach for handling NPC agency, player inaction, and extended downtime.
- Replaced `campaign/Living_World_Engine.md` with a deprecation notice and pointers to useful preserved reference material.
- Reclassified `campaign/world_engine/` as a legacy GM archive. Its political dossiers, minor houses, jurisdictions, factions, rumor records, information networks, and seasonal context remain available as descriptive references; ledgers are historical records, not live simulation databases.
- Rewrote `campaign/Worldbuilding_Readiness.md` to reflect current campaign readiness, the dependency on final PC materials, and the actual worldbuilding priorities.
- Updated the development roadmap, current world state, and campaign indexes to remove active simulation instructions.
- WTR-001 remains a historical zero-time opening snapshot on 1 Harvestfall, 243 AC. No further automated world turns are planned or required. No lore, NPC, faction, or map assets were deleted.


## 2026-11-09 — Medicine, disease, and healing framework added

- Added `campaign/world/Medicine_Disease_and_Healing.md` as a GM reference covering household care, midwives, barber-surgeons, physicians, herbalists, temples, injury, disease categories, sanitation, childbirth, disability, Pathfinder healing, class access, and medical belief.
- Distinguished practical care, learned medicine, folk practice, religious care, and supernatural healing. Confirmed that clergy are not automatically spellcasters and that no temple or healer can provide unestablished magical services on demand.
- Kept named practitioners, local facilities, specific endemic diseases, medical guilds, and epidemic events unresolved. No new disease outbreak or magical cure was established.
- Linked the reference from Everyday Life and Material Culture and the campaign directory index.


## 2026-11-09 — Agriculture, food supply, and seasonal work reference

- Added `campaign/world/Agriculture_Food_and_Seasonal_Work.md` as a cross-regional GM reference for agricultural society, major food-producing regions, crops, livestock, seasonal labor, storage, milling, transport, food markets, scarcity, and regional climate tendencies.
- Consolidated useful descriptive material from the retired seasonal operating worksheet while removing world-turn fields, automatic event propagation, and simulation procedures.
- Preserved the variable-season calendar rule and the opening-date safeguards: no specific weather event or famine is established on 1 Harvestfall, 243 AC.
- Reframed the continental economic network as a descriptive reference for GM judgment rather than a Living World Engine input.
- No crop yields, prices, disease events, regional borders, or current shortages were invented.


## 2026-11-09 — Military reference reframed for GM judgment

- Reframed `campaign/military/Continental_Military_Institutions_and_Operational_Doctrine.md` as a GM reference rather than a Living World Engine procedure.
- Preserved established Crown and Great House force distinctions, senior military roles, vassal and clan obligation boundaries, logistical constraints, and unresolved force totals.
- Replaced the automated mobilization sequence and escalation ladder with descriptive guidance on authority, information, readiness, and the non-automatic nature of military action.
- Added a military folder index and linked the reference from the campaign directory and GM Campaign Bible.
- No troop totals, fleet sizes, readiness figures, new commanders, mobilizations, or wars were invented.


## 2026-11-09 — Political and legal references aligned with GM judgment

- Removed remaining active Living World Engine language from the Imperial Governance, Crown Intelligence, and Feudal Law references.
- Preserved the Council's established voting and authority rules, political knowledge boundaries, Crown information practices, and feudal legal framework.
- Reframed political escalation and information assessment as GM reference guidance rather than automated simulation procedures.
- Reclassified the former engine launch questions in the Open Questions Register as legacy opening-state context; WTR-001 remains a historical snapshot only.
- No legal rights, Council thresholds, intelligence operations, political events, or military obligations were changed.


## 2026-11-09 — Legacy world-state archive language cleaned

- Reframed remaining world-engine actor and faction records as descriptive GM references rather than simulated actors or automated event hooks.
- Reframed the continental strategic-pressure register as structural political context; tensions do not become active events without GM judgment.
- Clarified that WTR-001 and the initial issue/project registers are historical opening-state references, not recurring procedures.
- Updated the legacy archive index to point to the current agriculture and military references.
- No actors, factions, issues, projects, political positions, or historical events were added or removed.


## 2026-11-09 — Education, literacy, and knowledge reference added

- Added `campaign/world/Education_Literacy_and_Knowledge.md` as a cross-regional GM reference for childhood learning, literacy, numeracy, apprenticeship, noble and administrative education, religious instruction, scholarship, books, translation, and social access to knowledge.
- Consolidated the established Collegium of the Nine Lamps as the named independent scholarly network, while leaving its ranks, training, governing body, and geographic reach unresolved.
- Corrected a contradiction in `campaign/religions/Religion_and_Faith.md`, which had described the scholarly tradition's name as unresolved despite the established name in `Cultures_and_Societies.md`.
- Linked the new reference from the world folder index. No literacy percentages, named schools, new institutions, or language systems were invented.


## 2026-11-09 — Law, justice, and crime reference added

- Added `campaign/world/Law_Justice_and_Crime.md` as a cross-regional GM reference for sources of law, jurisdiction, civil disputes, crime, investigation, evidence, hearings, punishment, status, enforcement, and commercial disputes.
- Used Tallowmere's established civic offices and the approved feudal legal framework as concrete examples without inventing a universal court code.
- Reframed the feudal landholding section as GM adjudication guidance rather than a world-engine application procedure.
- Linked the new reference from the world index and Tallowmere's local government-and-law record.
- Left detailed regional criminal procedure, evidence rules, appeal rights, and specific penalties unresolved.


## 2026-11-09 — Travel, communication, and information reference added

- Added `campaign/world/Travel_Communication_and_Information.md` as a GM reference for foot, mounted, cart, caravan, river, coastal, and inland-sea travel; road infrastructure; stopping places; weather; jurisdiction; messengers; letters; public notices; maps; and information delays.
- Preserved the six established continental corridors and Tallowmere's local routes without inventing exact geometry or surveyed travel times.
- Clarified that there is no established universal postal service, passport system, standardized signal code, or omniscient information network.
- Linked the reference from the world folder index and campaign directory.
- No new roads, waystations, ports, couriers, travel schedules, or map geometry were created.


## 2026-11-09 — Readiness and GM Bible navigation updated

- Updated `campaign/Worldbuilding_Readiness.md` to reflect the new agriculture, medicine, law, military, education, and travel/communication references and to focus remaining natural-history work on reviewing proposed Tallowmere species rather than creating unsupported populations.
- Added navigation from the GM Campaign Bible to the new practical world references, including food supply, education, law, and everyday systems.
- The GM Bible remains marked for substantial consolidation and expansion; these links do not represent the final printable edition.


## 2026-11-09 — Previous PC concepts reclassified as provisional

- Reclassified the earlier vampire/ratfolk shared-backstory draft and the House Relland merchant incident as provisional legacy PC material pending player confirmation.
- Preserved the source records for continuity, but clarified that the incident, its named participants, concealment, and evidence trail are not current campaign facts unless the players confirm the concept.
- Clarified that the prepared Selwick wagon/troll opening remains an option pending final character sheets and encounter review.
- Updated the GM Campaign Bible's campaign-state section to prevent new worldbuilding from assuming unconfirmed PC ancestries, histories, secrets, relationships, or personal hooks.
- No established Great House, regional geography, or independent minor-house identity was changed.


## 2026-11-09 — Legacy PC references and historical ledgers clarified

- Reclassified the remaining player-character ambition and arrival entries in the Open Questions Register as provisional legacy concepts.
- Updated the Names and Terminology Index so PC-specific relationships, the old world-turn ledger, and the former simulation snapshot are not presented as active systems or current character facts.
- Updated NPC information boundaries to keep prior PC secrets and the House Relland incident inactive until confirmed.
- Corrected the historical dynasty reference in Current World State to avoid using the inherited Westeros source name as an in-world canon name.


## 2026-11-09 — Session and PC-dependent open questions corrected

- Updated P0 session questions to reflect that Tallowmere is established but the prior two-PC relationship and troll opening are not current assumptions.
- Reclassified the earlier ratfolk family-history question as a provisional legacy concept.
- Updated the military, agriculture, and Crown intelligence question statuses to point to the current GM references rather than retired proposal worksheets.
- Corrected the GM Bible's historical-survivor wording so the secret remains established without assuming the survivor is a current PC.
- Repeated NPC information-boundary sections now consistently treat prior PC secrets and the House Relland incident as provisional.


## 2026-11-09 — Canon register and legacy master bible corrected

- Reclassified the previous vampire/ratfolk player-character concepts and their relationship as provisional legacy material in the Canon Register.
- Reclassified Tallowmere as the established starting city while making PC arrival details and the prepared troll encounter provisional pending final player concepts.
- Corrected the Canon Register's Collegium of the Nine Lamps entry and removed the contradiction that its name remained unresolved.
- Marked the older 40-page `Campaign_Bible.md` as a legacy source archive, explicitly retired its world-simulator concept, and marked its old PC profiles as provisional.
- Reframed Great House actor dossiers as legacy GM roleplaying references rather than simulation actors.


## 2026-11-09 — Canon Register player sections and legacy simulator archive fixed

- Replaced the remaining Canon Register entries that treated the earlier PC relationship and ambitions as established with provisional legacy status.
- Clarified that Tallowmere and the campaign date are established while party composition, arrival circumstances, and the Selwick/troll opening await confirmation and approval.
- Replaced the outdated unresolved Collegium name in the Canon Register with the established Collegium of the Nine Lamps.
- Removed the retired simulator procedure from the old Campaign Bible section, retaining only an archive notice; marked the old PC profiles and starting-point assumptions as provisional.

## 2026-11-09 — Soldier life and military service expanded

- Added `campaign/military/Soldier_Life_and_Military_Service.md` as a GM reference for recruitment, training, garrison routines, equipment, food, service obligations, discipline, campaigning, wounds, veterans, and the human realities of armed service.
- Kept force totals, pay scales, universal service terms, ranks, and local military procedures unresolved unless supported by existing records.
- Linked the new reference from the military index. No new units, deployments, wars, or military obligations were established.

## 2026-11-09 — Markets and commercial life expanded

- Added `campaign/economy/Markets_Merchants_Guilds_and_Contracts.md` covering commercial roles, markets, guilds and craft associations, quality and measures, contracts, credit, transport risk, ports, merchant reputation, fraud, and commercial influence.
- Distinguished established continental trade relationships from proposed local commercial practices. No universal guild structure, weights and measures, contract code, market schedule, tariff, price, or insurance system was established.
- Linked the new GM reference from the economy index. No new merchant factions, guilds, charters, prices, or trade routes were created.

## 2026-11-09 — Currency and moneychanging clarified

- Added `campaign/economy/Currency_Coinage_and_Moneychanging.md` to establish Pathfinder First Edition coin denominations and practical guidance for cash, large payments, moneychanging, credit, price variation, and monetary disputes.
- Kept regional coin designs, mints, historical reforms, universal exchange fees, and formal banking institutions unresolved.
- Linked the reference from the economy index. No new currency names, mints, exchange rates, or monetary institutions were invented.


## 2026-11-09 — Tallowmere frontier habitats reconciled with ecology index

- Updated `campaign/creatures/Tallowmere_Regional_Ecology.md` to include the established Siltfen, Outer Eastern Shore, and frontier environments described in `Wilderness_Beyond_Tallowmere.md`.
- Clarified that the frontier is less continuously worked and protected, not uniformly hostile, and that possible creature lists in the wilderness framework do not establish confirmed populations or lairs.
- Updated the GM Campaign Bible's natural-world overview and the creature index cross-reference.
- No species occurrence, frequency, migration, lair, coordinates, jurisdiction, or new geographic feature was canonized.


## 2026-11-09 — Continental ecology and biogeography framework added

- Added `campaign/creatures/Continental_Ecology_and_Biogeography.md` to synthesize established environmental tendencies across the Northern Wilderness, western highlands and heartlands, Crownlands, Inland Sea, Kharadorn mountains, eastern forests and shore, Great Delta, Southwestern Marches, Southern Principalities, and Southern Islands.
- Grounded the framework in the existing geography and agriculture records. It distinguishes environmental tendencies from detailed climate classifications, species inventories, migrations, and supernatural ecology.
- Linked the reference from the creature index and GM Campaign Bible; updated readiness and roadmap notes.
- No species ranges, population counts, migration routes, climate normals, disease events, or new geographic features were established.


## 2026-11-09 — Tallowmere frontier wildlife and flora expanded

- Extended the proposed wildlife catalogue to cover the Deep Bracken, Upper Vale, Greyback Heights, Siltfen, and Outer Eastern Shore, using the existing wilderness framework as the geographic authority.
- Extended the proposed flora reference to cover the same frontier habitats and their practical uses.
- Kept all new species and plant distributions PROPOSED. Possible Pathfinder threats in the wilderness reference remain distinct from ordinary fauna and confirmed populations.
- Corrected the wildlife catalogue's section numbering after inserting the frontier material.
- No species frequency, exact occurrence, migration, lair, harvesting right, or magical ingredient was established.


## 2026-11-09 — Deep Bracken wildlife status reconciled

- Reconciled the wildlife catalogue with `campaign/locations/starting_city/Wilderness_Beyond_Tallowmere.md`, which explicitly describes deer, boar, foxes, badgers, and wolves as common animals in the Deep Bracken.
- Marked those five ordinary fauna as established occurrences in that named habitat only. No population size, pack territory, attack frequency, or distribution elsewhere was inferred.
- Clarified the Tallowmere ecology baseline, creature index, and GM Campaign Bible so the mixed status is visible and the remaining species candidates stay proposed.
- Kept possible Pathfinder threats, lairs, and supernatural ecology unconfirmed.


## 2026-11-09 — Deep Bracken common fauna dossier added

- Added `campaign/creatures/Deep_Bracken_Common_Fauna.md` with practical natural-history and GM portrayal guidance for the five animals already established as common in the Deep Bracken: deer, wild boar, foxes, badgers, and wolves.
- Covered feeding, behavior, field signs, seasonal portrayal, human relationships, occupational knowledge, and protected unknowns.
- Kept exact populations, territories, den locations, hunting laws, bounties, and unusual individuals unresolved. No local subspecies, supernatural traits, or new wildlife populations were invented.
- Linked the dossier from the creature index and GM Campaign Bible.


## 2026-11-09 — River Vale and Siltfen aquatic ecology developed

- Added `campaign/creatures/River_Vale_and_Siltfen_Aquatic_Ecology.md` as a GM-only practical reference for the River Vale watershed and Siltfen wetland.
- Consolidated established resource use: River Vale fishing; Siltfen fishing, eel and frog resources, waterfowl gathering, reed cutting, useful plant gathering, and limited grazing on firmer ground. Preserved the established uncertainty around overlapping Siltfen rights.
- Distinguished the lower navigable river, its pools, mill reaches, gravel bars, tributaries, and flood meadows from the Siltfen's shallow pools, muddy channels, reed beds, wet meadows, and firmer ridges.
- Added practical guidance on fishing as household and commercial work, reed harvesting, food handling and preservation, river transport, flooding, water hazards, occupational knowledge, and sensory portrayal.
- Kept exact fish and bird species, fishing methods, catch volumes, prices, rights boundaries, migration and spawning schedules, and unusual aquatic animals unresolved. No new guild, named fisher, active dispute, disease event, or monster population was created.
- Linked the new reference from the wildlife catalogue, ecology baseline, creature index, GM Bible, readiness record, and roadmap.


## 2026-11-09 — Tallowmere foodways reference added

- Added `campaign/world/Foodways_of_Tallowmere_and_the_Hinterland.md` as a GM-only synthesis of local food supply, household meals, public eating, cooking, preservation, seasonality, and food as social information.
- Grounded the local account in established supply relationships: Millhaven grain and milling, nearby farms and estates, Saltwick fresh and preserved fish, Brackenholt fuel, and Tallowmere's named food businesses and their listed opening inventories.
- Incorporated the existing menus of the Copper Ladle, Crooked Oar, Blue Heron, Three Grain Bakery, and Salt & Root Provisioners without changing their stock or prices.
- Distinguished established businesses, goods, and menus from illustrative household patterns. No new recipes, named foods, suppliers, prices, religious fasting rules, shortages, or regional culinary customs were made canon.
- Linked the reference from agriculture, everyday life, GM Bible, readiness, and roadmap records.


## 2026-11-09 — Tallowmere medical care network clarified

- Added `campaign/locations/starting_city/Medical_Care_in_Tallowmere.md` as a GM-facing local guide to the city's established care network and sanitation context.
- Integrated established roles for Lantern Hospice, Sister Alwen, Brother Halen, Edda Moss, Fenna Wale, Miraq Ashwhisk, and the House of the Dawn without inventing new practitioners or facilities.
- Distinguished charitable care, midwifery, practical healing, herbalism, alchemical craft, religious care, and Pathfinder spellcasting.
- Documented practical patient pathways, hospice limitations, childbirth and household care, sanitation vulnerabilities, occupational knowledge, and GM portrayal guidance.
- Reconciled `campaign/world/Medicine_Disease_and_Healing.md` so the established hospice and named providers are no longer left as entirely unresolved. Exact capacity, staffing, visiting physicians, endemic diseases, and public magical-healing services remain open.
- Linked the local guide from the world index, GM Bible, readiness record, and roadmap.


## 2026-11-09 — Tallowmere water, waste, and street cleanliness documented

- Added `campaign/locations/starting_city/Water_Waste_and_Street_Cleanliness.md` as a GM reference for established public wells, pumps, the Old Cistern, drains, privies, uneven refuse arrangements, district differences, flood risks, and household water practices.
- Distinguished established infrastructure from plausible household and neighborhood behavior. The Old Cistern remains a specific public resource, not a citywide water network.
- Documented likely sanitation pressures and disputes without creating an active contamination event, disease outbreak, public-health department, universal sewer, or citywide refuse service.
- Linked the reference from residential life, medicine, the Tallowmere GM dossier, GM Bible, readiness record, roadmap, and changelog.


## 2026-11-09 — Tallowmere household comfort and winter preparation expanded

- Added `campaign/locations/starting_city/Household_Comfort_Fuel_and_Winter_Preparation.md` as a GM reference on fuel, heating, lighting, clothing, laundry, repair, and seasonal household preparation.
- Grounded the local material in Brackenholt's established firewood and charcoal supply, the Blue Heron's listed laundry service, existing lighting goods, and documented seasonal preparation needs.
- Distinguished practical household portrayal from established local business facts. No new tailor, laundress, candle-maker, fuel tariff, household consumption figure, or winter weather event was created.
- Linked the reference from everyday life, workforce, GM Bible, readiness, roadmap, and changelog.


## 2026-11-09 — Arcane patronage, magic-item scarcity, and Temple Champions established

- Added campaign/magic/Arcane_Arts_and_Wizardry.md to define the rare, private, patronage-based arcane profession; no magical academies; self-directed study from rare texts; and private apprenticeships.
- Added campaign/magic/Magic_Items_and_Enchantment.md to establish a restricted and exceptionally expensive magic-item market, Great House patronage, limited production, and player-facing acquisition principles.
- Clarified that the Collegium of the Nine Lamps is a scholarly network, not a magical academy or wizard-training institution.
- Established the Temple Champion tradition for permanent temples, distinguishing defenders from ordinary clergy and clerics; set limits on investigations, mobilization, and crusades.
- Preserved Pathfinder First Edition crafting and character mechanics: no extra mandatory ingredients, crafting costs, checks, or prerequisites were introduced. No individual Champion or new magical institution was named.


## 9 November 2026 — Tallowmere public life and neighborhood culture

**Added:** `campaign/locations/starting_city/Public_Life_Neighborhoods_and_Entertainment.md`.

**Integrated:** Updated the Tallowmere starting-city index, Tallowmere GM dossier, GM Campaign Bible reference index, Development Roadmap, and Worldbuilding Readiness.

**What changed:** Documented established public gathering places and their distinct roles, including Bellmarket, the Copper Ladle, the Blue Heron, the Crooked Oar, the Sailors' Shrine, Lantern Ward institutions, residential spaces, and the decentralized Underways. Added practical guidance on information networks, rumor reliability, childhood, older residents, informal leisure, class, ancestry, and neighborhood belonging.

**Canon discipline:** Existing venues and established facts remain canon. General social patterns are labeled as portrayal guidance. No school system, named performers, clubs, new entertainment venues, legal restrictions, or formal associations were invented. Exact venue schedules, named local games, and other low-value details remain unresolved.

**Approval status:** GM-directed development; portrayal guidance is not a new binding rule or institutional canon.


## 9 November 2026 — Tallowmere education pathways reconciled

- Reviewed the continental education and literacy framework against the latest local religion, workforce, commerce, and public-life records.
- Clarified that the Open Ledger teaches basic numeracy to a limited number of pupils, without establishing a public school or broad curriculum.
- Connected existing local apprenticeship examples and practical instruction through workshops, commercial houses, scribes, and private tutors.
- Reaffirmed that Pell & Daughter is a scribal/stationer service, not a school, and that other temples are not automatically educational institutions.
- Updated the Development Roadmap. No school system, academy, literacy rate, or new named tutor was invented.


## 9 November 2026 — Tallowmere communication channels reconciled

- Expanded `campaign/world/Travel_Communication_and_Information.md` with a grounded local account of public notices, civic records, harbor administration, commercial and regional reporting, ratfolk networks, household and religious channels, letters, and courier limits.
- Integrated established contacts and information boundaries from `campaign/world_engine/Tallowmere_NPC_Information_Network.md` without treating the legacy dossier as an automated system or secret organization.
- Distinguished observation, record, report, inference, and rumor as separate knowledge categories for GM adjudication.
- Clarified that Council agenda notices are posted at Reeve's Hall and the principal market, while closed-session matters and private records are not automatically public.
- Cross-referenced the Tallowmere public-life dossier in the GM Campaign Bible and updated the Development Roadmap.
- No universal postal service, guaranteed delivery schedule, royal relay network, or new courier group was established.


## 9 November 2026 — Tallowmere law in practice

- Added `campaign/locations/starting_city/Law_in_Practice_and_Local_Justice.md` to translate established legal authority and named civic roles into practical table guidance.
- Clarified the distinct responsibilities of Lord Oswin, Reeve Marrec Holt, Chief Magistrate Odran Pell, Captain Brinna Salk, Harbor Master Ysella Vane, Castellan Hadrik Voss, guilds, community mediators, and Kharadorn's strategic representatives.
- Documented complaint pathways, evidence limitations, ordinary civil disputes, Watch response, hearings, remedies, unequal access, and illustrative local cases.
- Cross-referenced the new guide from the Tallowmere index, Government and Law, Tallowmere GM Dossier, and GM Campaign Bible; updated the Development Roadmap.
- Kept holding-cell location/capacity, custody and surety rules, appeal procedure, exact penalties, Watch staffing, and full charter wording unresolved. No new legal powers, universal procedures, or fixed sentence tariffs were created.


## 9 November 2026 — Tallowmere emergency response and civic resilience

- Added `campaign/locations/starting_city/Emergency_Response_and_Civic_Resilience.md` using the established Watch, garrison, Harbor Master, Reeve, Master of Stores, Old Cistern, hospice, House of the Dawn, and current warehouse-fire dispute.
- Documented practical response considerations for fires, harbor and river accidents, flooding, injury, temporary shelter, warnings, evacuation limits, and unequal recovery.
- Distinguished established capacities and current pressures from practical GM portrayal guidance. Preserved the fact that the warehouse fires are small incidents/near-misses, no major warehouse has burned, and their cause is unknown.
- Cross-referenced the guide from the Tallowmere index, GM dossier, and GM Campaign Bible; updated the Development Roadmap.
- Did not create a professional fire brigade, rescue flotilla, public emergency department, standardized alarm code, citywide evacuation plan, relief fund, or active disaster. Cistern capacity, stores inventory, response tools, and local procedures remain unresolved.


## 9 November 2026 — Odran Pell identity continuity resolved

- Reconciled the NPC roleplaying dossier and open-questions register against the established Names and Terminology Index and Shopkeepers and Stock record.
- Confirmed that Chief Magistrate Odran Pell is the same person who is Elira Pell's father and senior partner at Pell & Daughter. The name collision is not a second NPC.
- Updated the Civic NPC record and consolidated the NPC dossier roster into one entry.
- The dual civic/commercial role is established. No formal recusal rule, conflict-of-interest procedure, or additional legal restriction has been invented.


## 9 November 2026 — Tallowmere reference formatting cleanup

- Replaced literal escaped paragraph-break characters with proper Markdown line breaks in `Government_and_Law.md` and `Tallowmere_GM_Dossier.md`.
- No lore, procedure, NPC identity, or canon status changed.


## 9 November 2026 — Session One references reconciled with GM-led campaign operation

- Updated `Session_One_Sandbox_Reference.md` to remove obsolete references to a completed/required world turn and the retired world engine. The GM now determines actor actions and consequences as in-world time passes; no automated simulation or mandatory escalation is used.
- Marked the legacy party assumptions and troll/Selwick opening explicitly provisional in the sandbox reference. The city sandbox remains usable independently of those concepts.
- Updated `Session_One_GM_Readiness_Packet.md` to clarify GM-led time progression and add the recent local references for justice, emergency response, social life, medicine, sanitation, foodways, and communication.
- Updated Development Roadmap and Worldbuilding Readiness. No PC concepts, opening encounter, or world event was newly approved.


## 9 November 2026 — Historical opening snapshot and roadmap status clarified

- Renamed the legacy `WTR-001` section in `Current_World_State.md` as a historical opening-state review. It records a zero-day continuity snapshot only; it is not a recurring world-turn procedure or permission to run simulations.
- Updated the Development Roadmap's current milestone. The former 8 November Session One target is historical; party concepts and the troll/Selwick opening remain provisional pending player confirmation and GM approval.
- This is a scope and status clarification only. No in-world time, event, or campaign outcome changed.


## 9 November 2026 — Player starting handout refreshed

- Updated `player_materials/Player_Starting_Handout.md` to reflect the recent arcane scarcity and magic-item market lore, more precise Kharadorn maritime influence, Tallowmere's established public gathering places and charitable institutions, and the meaning of the major calendar observances.
- Clarified that the nearby settlement list is not exhaustive and that familiarity with minor places depends on a character's background.
- Removed legacy assumptions that the party consists of two level-five characters who already know one another. Party size, levels, relationships, starting resources, and opening circumstances now await confirmed character sheets and GM approval.
- Kept GM-only history, rumor truth, hidden routes, private motives, and other secrets out of the player handout.


## 9 November 2026 — Tallowmere shopkeeper and service NPC dossiers expanded

- Expanded the NPC roleplaying collection with profiles for Della Rusk, Hadran Voss, Toman Brindle, Ressa Brindle, Veyra Dane, Pellik Sorn, Edrin Salk, Merra Venn, and Fenna Wale.
- Expanded the existing entries for Edda Moss and Brother Halen to provide table-ready motivations, fears, social methods, voice cues, and clear role boundaries.
- Updated the NPC continuity roster: regional figures with existing profiles are marked complete, Tessa Vale is no longer incorrectly listed as unfinished, and the duplicate Odran Pell roster row was removed.
- Kept all new personality details as GM portrayal guidance, with provisional alignments or unspecified alignments where appropriate. No new family members, criminal ties, business stock, prices, or hidden histories were invented.
- Updated the Open Questions Register to reflect completion of the currently named Tallowmere proprietor and recurring service-contact profiles. The Selwick wagon guards and proposed companion remain unfinalized.


## 9 November 2026 — Tallowmere civic calendar and local justice reconciled

- Reconciled `Civic_Calendar_and_Seasonal_Routines.md` with the formal calendar established in `history/Calendar.md`. Removed obsolete statements that month names, weekdays, year length, era, and campaign date were unresolved.
- Preserved open local details: market-day frequency, bell times and signal patterns, gate hours, and exact dates of local observances. Clarified that local customs complement the wider holidays and that no standardized citywide alarm code is established.
- Corrected the Weighing of Measures description to place official weighing at the established Weigh House and organize the observance through the Reeve's office.
- Reconciled `Law_in_Practice_and_Local_Justice.md` with `Streets_Landmarks_and_Routes.md`: the Watch House near Market Street and the North Gate contains short-term holding cells and is not a long-term prison. Capacity, staffing, and custody procedures remain unresolved.
- Added Tallowmere's local civic observances to the player handout and linked the civic calendar from the Tallowmere GM dossier.
- Updated the Development Roadmap. No new festival dates, market schedule, bell code, gate hours, or legal procedure were invented.


## 9 November 2026 — Tallowmere landmark and service terminology audit

- Clarified the distinction between the Rivergate district and River Gate access point in the city layout reference.
- Clarified that The Ferry Steps is the managed crossing operated by the business The Ferryman's Steps. The River Steps public landing remains a separately named feature; its exact relationship to the ferry crossing is unresolved and no map placement was inferred.
- Added the Watch House, Weigh House, Weighers' Court, Denvor Granary, Old Cistern, and local crossing terminology to the Names and Terminology Index.
- Reconciled the index's Civic Calendar status with the established formal calendar.
- Reconciled the law guide with the Watch House's established short-term holding cells and the emergency guide with the Denvor Granary's public-provisioning role and the separate Master of Stores office.
- Corrected escaped Markdown paragraph breaks in `Residential_Life_and_Housing.md` and `Workforce_and_Daily_Life.md`. Removed unsupported gender assumptions from newly expanded NPC profiles where source records do not establish gender.
- No coordinates, street alignments, gate schedules, or new geographic features were added.


## 9 November 2026 — GM Campaign Bible consolidation checkpoint

- Updated the GM Campaign Bible's consolidation date, clarified that the responsive setting is advanced through GM judgment rather than automated simulation, and linked Tallowmere's established medical network.
- Rebuilt the authoritative reference index to include the recent Tallowmere local records, the expanded NPC roleplaying dossier collection, the travel/communication framework, ecology references, and the filtered player handout. Removed a duplicated generic `world/` index entry.
- Updated Worldbuilding Readiness to reflect the established Tallowmere medical network, named shopkeeper/service NPC profiles, and expanded local practical references.
- Updated the Development Roadmap: the next major task is a section-by-section GM Campaign Bible consistency and usability pass. The structured subject records remain authoritative.


## 9 November 2026 — GM Campaign Bible Tallowmere chapter

- Added a dedicated Tallowmere starting-city chapter to the GM Campaign Bible, synthesizing geography, House Denvor's chartered authority, local government, districts, trade dependencies, public life, information channels, medical care, water and sanitation, emergency capacity, current pressures, and player-knowledge boundaries.
- Reconciled the Kharadorn summary: Dragonstone is the controlled stronghold, Khar-Dum is the ancestral homeland, and the central inland sea is a strategic sphere of influence rather than blanket sovereignty over every shore.
- Updated the Bible's calendar summary to use the formal holiday names and include Tallowmere's established local civic observances.
- The new chapter is a study-guide overview; detailed subject records remain authoritative and are linked for deeper reference.


## 9 November 2026 — Obsydian and dragonglass distinction established

- Added `campaign/magic/Obsydian_and_Dragonglass.md` to record the GM-established distinction: obsydian is ordinary black onyx; dragonglass is a separate material made by dragons; both possess necromantic properties.
- Clarified that the materials are not interchangeable and have no automatic spell effect. Specific necromantic applications, dragonglass production, sources, and market values remain unresolved.
- Integrated the reference into the Magic index, Magic Items and Enchantment, GM Campaign Bible, Names and Terminology Index, Open Questions Register, and Worldbuilding Readiness.
- Kept any particular character's quantity or value of obsydian as a character-specific equipment decision, not a universal market price or starting allocation.


## 9 November 2026 — Great House and historical summaries reconciled

- Updated the GM Campaign Bible to identify Dragonstone explicitly as the ancestral island stronghold of the fallen dragon-riding dynasty and to record that the surviving Crown Prince was nine at the beginning of the rebellion. His personal name remains intentionally absent; any PC association remains provisional.
- Reconciled the current House Rulers dossier and legacy Great House actor reference: Kharadorn controls Dragonstone and maintains a dominant strategic position over key inland-sea routes and naval approaches, not blanket sovereignty over every shoreline.
- Retitled the legacy Great House actor section as GM portrayal and adjudication guidance rather than an active world-engine procedure.
- Added the player-facing obsydian/dragonglass summary to the material reference. The character-specific 100 gp quantity was not generalized into a market price or starting rule.


## 9 November 2026 — GM Bible Crown officeholder coverage expanded

- Expanded the Imperial Government and Court chapter to include all six established Crown officeholders: Royal Chancellor Othmar Rusk, Master of Coin Meredyth Sorn, Master of Laws Bastian Wycliffe, Master of War Garran Holt, Royal Spymaster Nerys Vale, and Lord Chamberlain Perrin Ashcombe.
- Distinguished Crown officers from the High Prelate and Prior-General, who are influential religious advisers rather than Crown officers or representatives of all faiths.
- Added direct reference links to the current House Rulers, Court and Council, and Imperial Governance framework records.


## 9 November 2026 — Arcane scarcity explanation reconciled

- Updated `Arcane_Arts_and_Wizardry.md` to state the established commercial role of patronage: powerful households commission selected magic items for sale or favored buyers while controlling production volume so the market is not flooded and scarcity, value, and strategic usefulness are preserved.
- Updated OQ-012 in the Open Questions Register. The core explanation for arcane scarcity is established; exact practitioner counts, distribution, and patron-by-patron production limits remain open.
- This does not establish a centralized licensing authority or a continent-wide conspiracy, and it does not change Pathfinder First Edition item prices or crafting rules.
