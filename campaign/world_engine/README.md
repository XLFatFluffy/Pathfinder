# Living World Engine — GM Reference

**Status:** Active continent-wide simulation system  
**Campaign start:** 1 Harvestfall, 243 AC

This folder contains the supporting records and turn history used by the Living World Engine. The engine models the established world independently of the PCs while preserving GM control over canon. The state layer is simulation-ready, but execution remains GM-reviewed under Living World Engine v2 until the campaign explicitly changes that operating mode.

## Current architecture

The campaign is being separated into two cooperating systems:

- **World Engine** — the macro world: political, military, economic, geographic, social, religious, environmental, and historical change that occurs whether or not the PCs are present.
- **Character Engine** — the characters: character state, decisions, conversations, exploration, combat, personal goals, discoveries, and direct interaction with the world.

The World Engine does not wait for the PCs to act. The Character Engine does not independently invent the macro world. Changes crossing the boundary are recorded as events and incorporated into subsequent world state.

**World exists → actors pursue goals → world changes → characters encounter the world → character actions create consequences → world incorporates those consequences.**

## Current work plan

The following is the active development plan for the World Engine. Work should proceed in this order unless a later campaign need requires a deliberate change.

### Phase 1 — Core world-state foundation

**Status:** Phase 1 model and machine-readable state layer established. The actor, world-state, event/history, and information models are defined in `Actor_Model.md`, `World_State_Model.md`, `World_Event_History_Model.md`, and `Information_Model.md`. `world_state.schema.json` defines the structured contract and `world_state.json` contains the 1 Harvestfall, 243 AC baseline assembled from authoritative campaign records. The state layer preserves unknowns instead of inventing unsupported values. Execution remains GM-reviewed.

1. Establish the consistent **world actor model** for Great Houses, Crown, minor houses, factions, major settlements, institutions, and other significant independent actors.
2. Establish the **world-state model** for locations, political authority, resources, relationships, projects, conflicts, and unresolved conditions.
3. Establish the **world-event/history model** so every significant simulated change can be recorded, dated, traced to causes, and carried forward.
4. Establish the **information model** distinguishing:
   - what is objectively true;
   - what an actor knows;
   - what an actor believes;
   - what is publicly known;
   - what remains GM-only;
   - what is unknown even to the GM until the simulation develops it.

### Phase 2 — Systems that make the world function

**Status:** Phase 2 models and baseline system state established. Economic, military, diplomatic/relationship, long-term project, and seasonal/environmental models are defined in `Economic_Model.md`, `Military_Model.md`, `Diplomatic_Relationship_Model.md`, `Project_Progress_Model.md`, and `Seasonal_Environmental_Model.md`. `world_state.schema.json` and `world_state.json` now carry structured Phase 2 system state. No unsupported numerical force, treasury, production, price, route, or weather values were introduced.

5. Build the **economic model** covering harvests, food, livestock, labor, major materials, trade, ports, taxation, wealth pressure, shortages, and surpluses where supported by canon.
6. Build the **military model** covering forces, bases, mobilization, supply, fortifications, naval capability, strategic objectives, and political constraints without simulating individual combatants.
7. Build the **diplomatic/relationship model** covering alliances, rivalries, debts, marriages, treaties, disputes, obligations, and changing political attitudes.
8. Build the **long-term project model** so actors can pursue goals over weeks, months, and years rather than only reacting to immediate events.
9. Build the **seasonal/environmental model** covering seasons, harvest timing, weather pressure, storms, drought, flooding, sailing conditions, and other consequences where relevant.

### Phase 3 — Discovery and uncertainty

10. Establish the **unknowns/discovery system** for things that may exist but are not yet established or known in-world. Unknowns must remain unresolved until the world provides a reason to reveal them.
11. Establish the **world-fork system** for major developments where multiple materially different futures become plausible.
12. Establish the **global transformation framework**. The campaign will eventually reach a point where the existing world may change fundamentally, but the nature, timing, and outcome of that transformation are intentionally undetermined.

### Phase 4 — Expanded world lore

13. Add detailed **Dothraki/orc lore**. The Dothraki are established as orcs, are known to the wider world, and are feared. Their detailed culture, political organization, major groups, territory, military structure, religion, economy, and relationships will be developed separately.
14. Expand the wider known and unknown world without inventing unsupported geography, borders, routes, or settlements.
15. Integrate dragons and the wider-world concept as long-term unresolved world elements rather than predetermined plot outcomes.

### Phase 5 — Continuous simulation

16. Run GM-reviewed world-state evaluations in discrete turns when warranted.
17. Commit every completed turn before beginning the next.
18. Carry unresolved consequences forward rather than resetting them.
19. Allow the world to develop independently of the PCs while keeping execution under GM review.
20. Feed meaningful player-created events back into the World Engine once the Character Engine exists.
21. Periodically review the resulting world state for major forks, emerging conflicts, and consequences that require GM approval.

## World-fork and major-twist rule

The eventual major transformation of the world is **not predetermined**.

The World Engine may identify a major fork when accumulated events make materially different futures plausible. When that happens, the simulation pauses at the decision point and presents the GM with the relevant possibilities.

The GM may:

- approve a direction;
- reject a direction;
- defer it;
- or allow the World Engine to determine the outcome.

The GM should not be given a hidden final answer merely to preserve the surprise. The future should remain genuinely uncertain until the simulation produces it.

Major twists must arise from accumulated world state and plausible causes. The engine must not manufacture dramatic events merely to create excitement.

## Active world concepts

The following are intentional long-term design elements and are not predetermined outcomes:

- **Dragons:** dragons are real; the old dragon-riding dynasty and the twelve-dragon historical peak are established canon. The fate and future relevance of surviving dragons remain unresolved.
- **Wider world:** the known world is not necessarily the whole world. The extent, nature, and future significance of distant or poorly understood regions remain unresolved.
- **Dothraki:** known and feared orc people. Detailed lore remains future work.
- **Global transformation:** the world may eventually change substantially. Its form and timing are intentionally unknown.

## Operating model

The simulation advances the world whether or not the PCs are present.

**Actor intent → available resources → information → opportunity → action → resolution → world-state update**

The simulation may advance political, military, economic, agricultural, religious, factional, environmental, and local conditions. It must not invent unsupported canon merely to create activity.

Every turn is recorded in GitHub. The repository is the persistent world history and the source of truth for simulated changes.

## Turn procedure

1. Establish the exact previous world state.
2. Advance the calendar by the defined turn interval.
3. Evaluate actors at continental, regional, and local scales.
4. Apply seasonal, geographic, economic, military, political, and information constraints.
5. Resolve actions using established motives and capabilities.
6. Record consequences and newly created conditions.
7. Update affected state records.
8. Commit the turn to GitHub before proceeding to the next turn.
9. Do not use a later turn to silently rewrite an earlier result. Corrections receive an explicit correction record.

## Canon boundaries

Established canon, simulated history, proposals, rumors, and unresolved unknowns must remain distinguishable.

If the source material does not support a concrete value, border, route, troop count, treasury amount, population figure, or event, the simulation must either:
- leave it unresolved;
- represent it as a clearly labeled simulation variable; or
- create a GM proposal requiring approval.

The simulation does not automatically promote assumptions into canon.

## Historical archive

Older world-turn documents may describe the former reactive/GM-reviewed workflow. Those documents remain historical records. The current system is the continent-wide simulation workflow established for the campaign preparation run.

## Campaign-start rule

The pre-campaign simulation begins one month before the campaign date and advances until **1 Harvestfall, 243 AC**. The PCs do not participate in these turns. Their actions begin affecting the simulation only after campaign play starts.
