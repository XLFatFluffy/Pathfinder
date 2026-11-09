# Campaign Creature Registry

**Status:** Working reference; individual entries carry their own canon status.  
**Last updated:** 2026-11-06  
**Rules baseline:** Pathfinder First Edition.

This registry is the campaign's source index for creatures, supernatural beings, regional threats, and creature ecology. It is intended to support both GM reference and a future in-app bestiary. It does not replace published Pathfinder stat blocks, and it does not make every published creature part of this setting.

## 1. Registry standards

Every entry must distinguish:

- **Setting status:** whether the creature or phenomenon is established in campaign canon, a prepared encounter, a report, a rumor, a proposal, or an unresolved mystery.
- **Evidence:** whether it has been directly encountered, reliably documented, reported by a credible source, or merely discussed.
- **Ecology:** where it is actually known to occur, where it may occur, and where no information exists.
- **Frequency:** common, uncommon, rare, unique, seasonal, extinct, or unknown. Do not assign frequency without support.
- **Knowledge:** what ordinary people, specialists, PCs, and the GM know. Folklore and mistaken beliefs must not be presented as objective truth.
- **Rules reference:** Pathfinder 1e source and relevant stat-block reference. Record adjustments separately and never silently alter published mechanics.
- **Relationships:** links to regions, locations, encounters, factions, NPCs, quests, and historical events.

A creature's presence in a planned encounter does not establish that it is native, common, or ecologically significant in the surrounding region.

## 2. Status vocabulary

| Status | Meaning |
|---|---|
| ESTABLISHED | Approved setting fact supported by campaign canon. |
| OBSERVED | Directly encountered in play; record the event and date. |
| DOCUMENTED | Supported by a reliable record or source, but not personally encountered by the PCs. |
| REPORTED | Credible or potentially credible report; not independently confirmed. |
| RUMORED | Unverified local belief or story. |
| PREPARED | Included in GM preparation, but not yet encountered in play. |
| PROPOSED | A possible addition awaiting GM approval. |
| UNKNOWN | Deliberately unresolved; do not fill the gap by inference. |
| EXTINCT | Confirmed extinct in the setting. Use only when canon supports certainty. |

Statuses describe the campaign's evidence, not a creature's challenge rating or danger.

## 3. Ecology vocabulary

Use these labels only when supported by evidence:

- **Common:** routinely encountered or reliably present in the stated area.
- **Uncommon:** present but not routinely encountered.
- **Rare:** few confirmed examples or highly restricted occurrence.
- **Seasonal:** occurrence changes predictably with season or migration.
- **Unique:** one known individual or singular entity.
- **Extinct:** no living examples remain, if confirmed.
- **Unknown:** distribution or frequency has not been established.

Record ecology by named region or habitat. Avoid continent-wide claims when the evidence is local. Do not infer a creature's distribution from a single encounter.

## 4. Creature entry template

Use this structure for each substantial entry:

### [Creature or phenomenon name]

- **Record ID:** stable identifier, lowercase and hyphenated.
- **Status:** one of the status values above.
- **Category:** animal, magical beast, humanoid, monstrous humanoid, aberration, undead, dragon, construct, outsider, plant, ooze, vermin, supernatural phenomenon, or other.
- **Pathfinder reference:** book/source and entry; do not reproduce the full stat block.
- **Rules notes:** only campaign-approved deviations from the published baseline.
- **Known range:** established regions and habitats only.
- **Frequency:** ecology label, or UNKNOWN.
- **Evidence:** encounter, document, report, rumor, or historical record.
- **Public knowledge:** what ordinary people commonly believe or know.
- **Specialist knowledge:** what trained or informed people may know.
- **PC knowledge:** what the PCs can reasonably know at campaign start, if established.
- **GM-only truth:** secrets, hidden behavior, origins, and unresolved facts.
- **Behavior and signs:** established observations only; separate folklore from evidence.
- **Threat and interaction:** known dangers, defenses, vulnerabilities, and noncombat interactions.
- **Related records:** links to regions, locations, encounters, NPCs, factions, quests, and events.
- **Last reviewed:** date and source of the review.

For in-app records, preserve these concepts as separate fields or structured sections. Visibility must be enforced by the app, not merely by hiding text in a player-facing page.

## 5. Initial registered references

These are the only entries registered in this first pass. The list is intentionally small; it records existing campaign material rather than inventing a bestiary.

### Troll

- **Detailed record:** [Troll](Troll.md).
- **Regional ordinary fauna:** [Tallowmere Regional Wildlife Catalogue](Regional_Wildlife_Catalogue.md) — established Deep Bracken common fauna plus proposed wildlife candidates elsewhere; see [Deep Bracken Common Fauna](Deep_Bracken_Common_Fauna.md) for the five established species.
- **Record ID:** `troll`
- **Status:** PREPARED
- **Category:** Giant
- **Pathfinder reference:** Pathfinder First Edition standard troll, CR 5.
- **Rules notes:** Use the published baseline. Its regeneration is overcome by fire or acid. Do not alter its statistics or add special abilities without GM approval.
- **Known range:** UNKNOWN. The planned roadside encounter is to be placed within roughly half a day's travel of Tallowmere, on the PCs' actual approach route. This planned location does not establish a native range or regional population.
- **Frequency:** UNKNOWN.
- **Evidence:** Prepared for the opening session; not yet confirmed encountered in play.
- **Public knowledge:** No specific local public account has been established.
- **Specialist knowledge:** Pathfinder rules knowledge may identify its regeneration and the fire/acid vulnerability; whether a particular NPC knows this is not established.
- **PC knowledge:** Depends on character skills, background, and information encountered during play.
- **GM-only truth:** The opening encounter is provisional until the completed PC sheets and companion statistics are reviewed.
- **Related records:** `../locations/starting_city/Session_One_GM_Readiness_Packet.md`.

### Dragons of the fallen dynasty

- **Record ID:** `fallen-dynasty-dragons`
- **Status:** ESTABLISHED historical category; present-day survival UNKNOWN.
- **Category:** Setting-specific dragon-like flying predators; do not automatically equate them with standard Pathfinder dragon species.
- **Pathfinder reference:** No standard PF1e stat block has been approved for these creatures.
- **Rules notes:** The historical creatures were enormous flying reptilian predators, bonded exclusively to members of the fallen ruling bloodline. One rider bonded to one dragon through a telepathic connection. Twelve existed at the dynasty's height.
- **Known range:** Historical association with the fallen dragon-riding dynasty; precise nesting grounds and geographic range remain unresolved.
- **Frequency:** No living population or present-day distribution has been confirmed. Most were killed during the Great Rebellion; the fate of any survivors remains UNKNOWN.
- **Evidence:** Established campaign history.
- **Public knowledge:** The former dynasty's use of dragons and the rebellion against its power form part of public history; details vary by source and social position.
- **Specialist knowledge:** Detailed bonding mechanics and historical numbers may not be universally known.
- **PC knowledge:** If a player character has a relevant connection to the fallen dragon-riding dynasty, determine personal knowledge from the final backstory and actual discoveries; do not infer identity or private history from this entry.
- **GM-only truth:** Whether any dragons survived, where they went, and whether the old bond can recur remain unresolved.
- **Related records:** `../history/World_History.md`, `../politics/` (fallen dynasty records), and the campaign timeline.

### Vampirism

- **Record ID:** `vampirism`
- **Status:** ESTABLISHED as a supernatural condition; origins and wider ecology UNKNOWN.
- **Category:** Undead / supernatural condition.
- **Pathfinder reference:** Pathfinder First Edition vampire template. Any campaign-specific mechanical adjustment must be recorded for the specific character or NPC to which it applies.
- **Rules notes:** An earlier player-character draft used the full vampire template with DR 5 bypassed by silver and magic. This is provisional legacy character material, not a universal vampire rule. Do not apply it unless the player confirms the concept and the GM approves the final build.
- **Known range:** UNKNOWN.
- **Frequency:** UNKNOWN.
- **Evidence:** Existing player-character and NPC records establish individual vampires.
- **Public knowledge:** General public understanding and regional folklore have not yet been comprehensively established.
- **Specialist knowledge:** No universal vampire taxonomy, progenitor structure, or reliable scholarly consensus has been established.
- **PC knowledge:** Character-specific knowledge belongs in the restricted character/NPC records.
- **GM-only truth:** Origins, transmission, age limits, lineages, vulnerabilities beyond the approved mechanics, and the full history of vampirism remain open.
- **Related records:** Restricted player-character records and any future vampire NPC dossiers.


### Deer

- **Record ID:** `deer`
- **Status:** ESTABLISHED as common Deep Bracken fauna.
- **Category:** Animal.
- **Pathfinder reference:** No exact species or stat block selected; use an appropriate published ordinary-animal entry only if mechanics are needed.
- **Known range:** Deep Bracken only; broader occurrence is not established by this record.
- **Frequency:** COMMON within Deep Bracken.
- **Evidence:** [Deep Bracken Common Fauna](Deep_Bracken_Common_Fauna.md) and the regional wildlife source record.
- **Public knowledge:** Ordinary residents of the hinterland may recognize deer and common signs of their presence. Local familiarity varies.
- **Specialist knowledge:** Hunters, trappers, foresters, and woodland workers may recognize tracks, feeding signs, and likely movement.
- **PC knowledge:** Basic recognition is ordinary for characters familiar with the region; specialist behavior and tracking depend on background and skills.
- **GM-only truth:** Exact species, population, range, herd structure, and seasonal movement remain unresolved.
- **Related records:** `Deep_Bracken_Common_Fauna.md`; `Regional_Wildlife_Catalogue.md`.
- **Last reviewed:** 2026-11-09, cross-checked against Deep Bracken Common Fauna.

### Wild boar

- **Record ID:** `wild-boar`
- **Status:** ESTABLISHED as common Deep Bracken fauna.
- **Category:** Animal.
- **Pathfinder reference:** No exact stat block or size variant selected; use an appropriate published ordinary-animal entry only if mechanics are needed.
- **Known range:** Deep Bracken only; broader occurrence is not established by this record.
- **Frequency:** COMMON within Deep Bracken.
- **Evidence:** [Deep Bracken Common Fauna](Deep_Bracken_Common_Fauna.md) and the regional wildlife source record.
- **Public knowledge:** Residents may know that boar forage in woodland and can be dangerous when cornered or protecting young. Specific local sayings remain open.
- **Specialist knowledge:** Hunters and woodland workers may recognize rooting, tracks, wallows, and signs of recent passage.
- **PC knowledge:** Basic recognition is ordinary for characters familiar with the region; hunting and tracking expertise depends on background and skills.
- **GM-only truth:** Exact population, range, breeding sites, and seasonal movement remain unresolved.
- **Related records:** `Deep_Bracken_Common_Fauna.md`; `Regional_Wildlife_Catalogue.md`.
- **Last reviewed:** 2026-11-09, cross-checked against Deep Bracken Common Fauna.

### Fox

- **Record ID:** `fox`
- **Status:** ESTABLISHED as common Deep Bracken fauna.
- **Category:** Animal.
- **Pathfinder reference:** No exact species or stat block selected; use an appropriate published ordinary-animal entry only if mechanics are needed.
- **Known range:** Deep Bracken only; broader occurrence is not established by this record.
- **Frequency:** COMMON within Deep Bracken.
- **Evidence:** [Deep Bracken Common Fauna](Deep_Bracken_Common_Fauna.md) and the regional wildlife source record.
- **Public knowledge:** Foxes are familiar woodland animals, but stories about them may exaggerate cleverness or supernatural significance.
- **Specialist knowledge:** Hunters and trappers may recognize tracks, dens, prey remains, and scavenging behavior.
- **PC knowledge:** Basic recognition is ordinary for characters familiar with the region; detailed tracking depends on background and skills.
- **GM-only truth:** Exact population, den sites, range, and seasonal movement remain unresolved.
- **Related records:** `Deep_Bracken_Common_Fauna.md`; `Regional_Wildlife_Catalogue.md`.
- **Last reviewed:** 2026-11-09, cross-checked against Deep Bracken Common Fauna.

### Badger

- **Record ID:** `badger`
- **Status:** ESTABLISHED as common Deep Bracken fauna.
- **Category:** Animal.
- **Pathfinder reference:** No exact species or stat block selected; use an appropriate published ordinary-animal entry only if mechanics are needed.
- **Known range:** Deep Bracken only; broader occurrence is not established by this record.
- **Frequency:** COMMON within Deep Bracken.
- **Evidence:** [Deep Bracken Common Fauna](Deep_Bracken_Common_Fauna.md) and the regional wildlife source record.
- **Public knowledge:** Residents may recognize badgers and their burrows, though they may not distinguish fresh from abandoned setts.
- **Specialist knowledge:** Woodland workers and hunters may identify setts, feeding signs, and disturbance.
- **PC knowledge:** Basic recognition is ordinary for characters familiar with the region; field signs require relevant experience.
- **GM-only truth:** Exact population, sett distribution, range, and seasonal behavior remain unresolved.
- **Related records:** `Deep_Bracken_Common_Fauna.md`; `Regional_Wildlife_Catalogue.md`.
- **Last reviewed:** 2026-11-09, cross-checked against Deep Bracken Common Fauna.

### Wolf

- **Record ID:** `wolf`
- **Status:** ESTABLISHED as common Deep Bracken fauna.
- **Category:** Animal.
- **Pathfinder reference:** No exact species, pack size, or stat block variant selected; use an appropriate published ordinary-animal entry only if mechanics are needed.
- **Known range:** Deep Bracken only; broader occurrence is not established by this record.
- **Frequency:** COMMON within Deep Bracken.
- **Evidence:** [Deep Bracken Common Fauna](Deep_Bracken_Common_Fauna.md) and the regional wildlife source record.
- **Public knowledge:** Residents may know wolves are present and can threaten livestock, but a particular loss is not automatically attributable to wolves.
- **Specialist knowledge:** Shepherds, hunters, trappers, and foresters may recognize tracks, scat, calls, and signs of a pack's passage.
- **PC knowledge:** Basic awareness is ordinary for characters familiar with the region; identifying a particular pack or its behavior requires evidence and relevant knowledge.
- **GM-only truth:** Exact population, pack territories, dens, range, and seasonal movement remain unresolved. Wolves are not automatically supernatural or connected to House Veyr.
- **Related records:** `Deep_Bracken_Common_Fauna.md`; `Regional_Wildlife_Catalogue.md`.

## 6. App and data-handling requirements

The in-app bestiary should eventually support:

1. Search and filtering by name, category, region, frequency, status, and threat.
2. Separate GM-only truth from player-visible public knowledge.
3. Multiple regional occurrences for one creature without duplicating its core record.
4. Links to encounters, locations, quests, NPCs, events, and session logs.
5. Source references and review history so a rumor does not silently become fact.
6. Encounter-specific notes that do not overwrite the master creature entry.
7. Import/export using stable record IDs and preview-first updates.
8. A distinction between a published rules reference and a campaign-specific rules adjustment.

Do not create or publish player-facing entries merely because a creature exists in this GM registry. Visibility is an explicit decision for each record and each knowledge section.

## 7. Next work

- Add creatures only when supported by campaign canon, planned play, or an explicit GM decision.
- After Session One, update the troll entry with what actually happened; do not assume the planned encounter occurred as written.
- Build regional ecology from observed and documented evidence, not from generic fantasy expectations.
- Keep dragon survival and vampirism origins unresolved until the campaign gives a reason to decide them.
- **Last reviewed:** 2026-11-09, cross-checked against Deep Bracken Common Fauna.
