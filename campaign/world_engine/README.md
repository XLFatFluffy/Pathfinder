# Living World Engine — GM Reference

**Status:** Active continent-wide simulation system  
**Campaign start:** 1 Harvestfall, 243 AC

This folder contains the supporting records and turn history used by the Living World Engine. The engine simulates the established world independently of the PCs, while preserving GM control over canon.

## Active records

- [Simulation Guidelines](Simulation_Guidelines.md) — mandatory rules for every world turn.
- [Actor Register](Actor_Register.md) — established people and institutions that may matter to world changes.
- [Initial Issue Register](Initial_Issue_Register.md) — established pressures and unresolved problems.
- [Tallowmere Political Actor Dossiers](Tallowmere_Political_Actor_Dossiers.md) — local political actors and constraints.
- [Regional Holdings and Jurisdictions](Regional_Holdings_and_Jurisdictions.md) — authority, charter relationships, vassalage, and unresolved boundaries.
- [Tallowmere NPC and Information Network](Tallowmere_NPC_Information_Network.md) — who can plausibly know what.
- [Tallowmere Rumor Truth Register](Tallowmere_Rumor_Truth_Register.md) — public rumor versus GM-only truth.
- [Regional Factions and Minor Houses](Regional_Factions_and_Minor_Houses.md) — local organized groups and supporting actors.
- [Continental Strategic Pressure Register](Continental_Strategic_Pressure_Register.md) — structural pressures that can become relevant through play.
- [Great House Actor Dossiers](Great_House_Actor_Dossiers.md) — established agendas, relationships, internal tensions, and constraints.
- [World Turn 001 Opening Baseline](reports/World_Turn_001_Opening_Baseline.md) — historical opening-state reference.
- [Simulation Turn History](reports/) — dated results of continent-wide simulation turns.

## Operating model

The simulation advances the world whether or not the PCs are present.

**Actor intent → available resources → information → opportunity → action → resolution → world-state update**

The simulation may advance political, military, economic, agricultural, religious, factional, and local conditions. It must not invent unsupported canon merely to create activity.

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
