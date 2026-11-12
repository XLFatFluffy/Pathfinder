# Living World Simulation Guidelines

**Status:** Mandatory GM simulation procedure  
**Campaign:** Pathfinder / Westeros-inspired setting  
**Current campaign date:** 1 Harvestfall, 243 AC

## 1. Purpose

The Living World Simulation models the continent as an active world that continues to change when the PCs are absent.

The simulation is not a quest generator. It is a world-state engine.

The goal is to answer:

> What would the established actors, institutions, settlements, factions, and systems actually do as time passes?

## 2. Source hierarchy

Before every turn, use this authority order:

1. Explicit GM decisions.
2. Latest approved world-state or decision record.
3. Dedicated subject lore and rules records.
4. Current World State.
5. GM Campaign Bible.
6. Older imported or legacy records.
7. Unapproved proposals.

A simulated result is historical simulation output. It must not silently overwrite established canon.

## 3. Turn discipline

Every turn must have:

- exact start date;
- exact end date;
- turn number;
- starting-state reference;
- actors evaluated;
- actions taken;
- resolutions;
- world-state changes;
- unresolved consequences;
- commit record.

**Every completed turn must be committed to GitHub before the next turn is run.**

Do not batch several turns into an unrecorded calculation and reconstruct them afterward.

## 4. Actor model

Each significant actor should be evaluated through:

- objective;
- current position;
- resources;
- information;
- relationships;
- constraints;
- opportunities;
- likely available actions.

Actors do not act because the GM needs an event. They act because their circumstances provide motive and opportunity.

## 5. Information discipline

Separate:

- what an actor actually knows;
- what an actor believes;
- what is publicly known;
- what is GM-only;
- what is unknown.

An actor cannot react to information they could not plausibly possess.

Rumors are not facts.

## 6. Scale

Run the simulation at four linked scales:

### Continental
Great Houses, Crown, major factions, major trade, major military movements, major diplomatic developments.

### Regional
Minor houses, regional disputes, roads, harvests, trade routes, garrisons, local political changes.

### Local
Settlements, guilds, merchants, civic authorities, local conflicts, construction, crime, supply, and seasonal conditions.

### Immediate
Scene-level consequences are normally handled during play rather than generated as abstract continent turns.

## 7. Systems

Evaluate only systems that have a reason to change.

Relevant systems include:

- politics;
- military readiness and campaigns;
- food and harvests;
- trade and transport;
- taxation and finance;
- labor and materials;
- religion;
- crime and faction activity;
- infrastructure;
- diplomacy;
- weather and seasonal constraints.

Do not simulate meaningless numbers merely because a spreadsheet can contain them.

## 8. Resolution

For each proposed action:

**Intent → capability → information → opportunity → opposition → constraint → outcome**

Outcomes should normally fall into:

- succeeds;
- partially succeeds;
- fails;
- delayed;
- redirected;
- creates a new issue;
- resolves an existing issue;
- remains unresolved.

Do not force binary outcomes when the established situation supports an intermediate result.

## 9. No event inflation

The simulation must not manufacture:

- wars;
- assassinations;
- rebellions;
- coups;
- famines;
- invasions;
- conspiracies;
- disasters;
- territorial changes

without a credible causal chain.

A quiet turn is a valid turn.

A month of administrative work, ordinary trade, delayed shipments, successful harvests, and unresolved negotiations is legitimate world history.

## 10. Unknown values

Do not invent exact:

- population;
- army size;
- treasury;
- prices;
- crop yields;
- distances;
- borders;
- coordinates;
- routes;
- fleet strength

unless established by campaign records or explicitly approved as simulation assumptions.

Where an exact value is unnecessary, use qualitative states such as:

- low;
- moderate;
- strong;
- strained;
- adequate;
- declining;
- improving.

## 11. Geography

Authoritative map artwork controls geography.

Never create borders, coordinates, roads, routes, or settlement placement from simulation logic alone.

A simulated political change does not automatically create a new map polygon.

## 12. Player separation

Before campaign start, PCs do not alter the simulation.

After campaign start, player actions become world events at the appropriate date and are incorporated into subsequent turns.

The simulation must never retroactively make PCs responsible for events that occurred before they entered the world.

## 13. Continuity

Each turn begins from the exact recorded state of the previous turn.

Do not reset actors to their original starting positions.

Do not repeat an event because it is still interesting.

Do not resolve an issue merely because it has existed for several turns.

Do not silently change an actor's personality, objective, allegiance, resources, or knowledge.

## 14. Corrections

If a simulation result is later found to conflict with established canon:

1. Do not erase the historical record.
2. Mark the affected result as superseded.
3. Record why it was invalid.
4. Establish the corrected state.
5. Continue future turns from the corrected state.

## 15. Turn record format

Each turn should be recorded in:
campaign/world_engine/reports/

Recommended filename:
World_Turn_###_YYYY-MM-DD.md

Each record must contain:

- date range;
- starting state;
- actor actions;
- system changes;
- resolved issues;
- newly created issues;
- unresolved conditions;
- major non-events;
- resulting state;
- continuity notes.

## 16. Campaign-start simulation

For the current campaign preparation:

- Start: **1 Goldleaf, 243 AC**
- End: **1 Harvestfall, 243 AC**
- PCs: absent
- Simulation: continent-wide
- Turn interval: approximately one week
- Every turn: recorded and committed before the next turn.

The resulting 1 Harvestfall state becomes the immediate pre-campaign world state.
