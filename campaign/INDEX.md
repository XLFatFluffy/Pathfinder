# Campaign Index

**Purpose:** Fast navigation for GM use. This is an index, not a separate canon source.

**Current campaign date:** 1 Harvestfall, 243 AC  
**Starting location:** Tallowmere  
**Ruleset:** Pathfinder First Edition  
**Setting:** Original high-medieval fantasy built around the political/dynastic framework of Westeros / Game of Thrones. Tallowmere is the starting city, not the whole setting.

## 1. Authority order

When two records disagree, use this order:

1. Explicit GM decisions in conversation.
2. Latest approved decision/stage record and current GM-approved change.
3. Latest dedicated subject lore/rules record.
4. Current World State.
5. GM Campaign Bible.
6. Older imported or legacy source material.
7. Unapproved proposals/brainstorming.

A later approved decision supersedes an earlier statement.

## 2. Start here

| Need | Open this first |
|---|---|
| Understand the whole setting | GM Campaign Bible |
| Verify current canon | Canon Register |
| Check the current baseline | Current World State |
| Check a name or superseded name | Names and Terminology Index |
| Find unresolved questions | Open Questions Register |
| Check continuity before adding lore | Continuity Checklist |
| Review why a decision was made | Worldbuilding Decision Log |
| Review launch/readiness state | Worldbuilding Readiness |
| Run the responsive world | Living World Engine v2 |
| Review development priorities | Development Roadmap |

## 3. Living World Engine

**Active system:** Living World Engine v2

Operating model:

**Observe → Propose → Review → Record → Surface**

The engine is GM-reviewed. It does not autonomously invent major canon, force NPC outcomes, run hidden turns, or expose GM-only information.

Supporting records:

- Actor Register
- Initial Issue Register
- Tallowmere Political Actor Dossiers
- Regional Holdings and Jurisdictions
- Tallowmere NPC and Information Network
- Tallowmere Rumor Truth Register
- Regional Factions and Minor Houses
- Continental Strategic Pressure Register
- Great House Actor Dossiers

Historical/retired records remain in the folder for provenance. In particular, do not treat the World Turn Ledger or retired World Turn Report Template as recurring procedures.

## 4. Tallowmere quick index

**GM starting point:** Tallowmere GM Dossier

| Topic | Record |
|---|---|
| City baseline | City Overview |
| Government and law | Government and Law |
| Local justice | Law in Practice and Local Justice |
| Civic procedure | Chartered Council and Civic Procedure |
| Civic calendar | Civic Calendar and Seasonal Routines |
| NPC roster | Civic NPCs |
| Full NPC portrayal | NPC Roleplaying Dossiers |
| Factions/local power | Faction Relationships and Local Power |
| Rumors | Current Situation and Rumors |
| Information flow | Communication, Records, and News |
| Ratfolk | Ratfolk Underways and Ratfolk Community Networks and NPCs |
| Commerce | Guilds and Commerce |
| Shops | Shopkeepers and Stock |
| Merchant relationships | Merchant Relationships and Supply Lines |
| Religion | Faith and Temples |
| Medicine | Medical Care in Tallowmere |
| Emergency response | Emergency Response and Civic Resilience |
| Daily life | Workforce and Daily Life |
| Regional settlements | Regional Settlements and Landholders |
| Regional geography | Regional Geography and Points of Interest |
| Regional routes | Streets, Landmarks, and Routes |
| Session One prep | Session One Current GM Packet |

## 5. Worldbuilding by subject

- Politics: politics/
- Great Houses / Crown: GM Campaign Bible, Canon Register, politics/
- History: history/
- Calendar: history/Calendar.md
- Geography: geography/ and maps/
- Economy: economy/
- Military: military/
- Religion: religions/
- Magic: magic/
- Creatures: creatures/
- Cultures: cultures/
- Everyday life: world/
- NPCs: people/
- Factions: factions/
- Player characters: player_characters/
- Player handouts: player_materials/
- Session records: ../sessions/

## 6. Maps and atlas

| Need | Record |
|---|---|
| Map library rules | maps/README.md |
| Layer registry | maps/atlas_layer_registry.json |
| Player/live synchronization layer | maps/atlas_player_layer.json |
| Continental authority | maps/continent_reference.md |
| Overlay standards | maps/atlas_overlay_standards.md |
| Political authority | maps/continental_political_authority_register.md |
| Tallowmere regional plan | maps/tallowmere_regional_layer_plan.md |
| Tallowmere regional content | maps/tallowmere_regional_content_spec.json |
| Tallowmere city plan | maps/tallowmere_city_layer_plan.md |

**Map rule:** The continental artwork is the authoritative master visual reference. Exact coordinates, borders, routes, and geometry are not to be invented. Geometry is promoted into the live synchronization layer only after calibration and review.

## 7. Player knowledge vs GM truth

Player-facing material is a filtered derivative.

- Common knowledge: major settlements, fortresses, Great Houses, current monarch, and major geographic features.
- Local knowledge: place-specific information.
- Specialist knowledge: profession, faith, military, scholarly, magical, or legal expertise.
- Rumor: an in-world claim whose truth may differ.
- GM-only: concealed truth, secrets, hidden routes, private motives, and unrevealed campaign facts.

Start with GM Campaign Bible for the knowledge model and Player Starting Handout for the filtered player baseline.

## 8. Database and app

| Need | Location |
|---|---|
| Import bundle | campaign/import/pathfinder_campaign_import.json |
| Import instructions | campaign/import/README.md |
| Structured seed | campaign/database/canonical_seed.json |
| Consolidated world export | campaign/database/world_master_export.json |
| Web app | web/ |
| Supabase migrations | supabase/migrations/ |
| Database tests | supabase/tests/database/ |

The import bundle currently contains 88 supported records. Treat the import bundle as an import artifact, not as the highest authority for lore.

## 9. Search terms

Use these exact terms when searching the repository:

- Tallowmere: Tallowmere, House Denvor, Greywatch, River Vale
- Great Houses: House Vaelorian, House Kharadorn, House Edarth, House Calderan, House Veyr, House Merrowen
- Crown: King Aldric Calderan, Valedorn, Imperial Seat, Imperial Council
- History: Great Rebellion, dragon-riding dynasty, Dragonstone, Khar-Dum
- Living world: Living World Engine, world_engine, world review, consequence proposal
- Maps: atlas_player_layer, atlas_layer_registry, tallowmere_regional, tallowmere_city
- Player knowledge: PLAYER-SHARED, GM-ONLY, Common knowledge, Local knowledge, Rumor
- Open questions: Open Questions Register, UNRESOLVED, PROVISIONAL
- Legacy names: House Targaryen and House Baratheon are source/legacy terms only; use current approved names in new setting-facing records.

## 10. Local command-line search

From the repository root:

    rg -n "Tallowmere|House Denvor|Greywatch" campaign
    rg -n "House Kharadorn|House Calderan|House Vaelorian|House Edarth|House Veyr|House Merrowen" campaign
    rg -n "UNRESOLVED|PROVISIONAL|GM-ONLY|PLAYER-SHARED" campaign
    rg -n "Living World Engine|world review|consequence proposal" campaign web
    rg -n "House Baratheon|House Targaryen" campaign
    rg -n "Dragonstone|Khar-Dum|Imperial Seat|Valedorn" campaign

For code/schema searches:

    rg -n "campaign_world_reviews|campaign_world_review_items|is_campaign_gm" web supabase
    rg -n "atlas_player_layer|atlas_layer_registry|source_id|location_source_id" web campaign/maps

## 11. Legacy/source-material rule

The repository intentionally contains older material for provenance. Examples include:

- campaign/Campaign_Bible.md
- retired world-turn reports/templates
- provisional player-character concept files
- source material under campaign/source_material/
- older decision-log entries describing superseded names or decisions.

Do not delete historical material merely because it is outdated. Mark it as superseded/legacy when necessary, and make the current record easy to find.

## 12. Play-readiness rule

The campaign does not need every unresolved mystery solved before play.

Before Session One, prioritize:

1. final player character sheets;
2. final backstories and player knowledge;
3. party size/level and companion decision;
4. opening scene;
5. mechanically checked encounters;
6. current maps and player-facing atlas;
7. session log;
8. Living World Engine v2 review workflow.

Everything else can be developed as play creates a reason to know it.
