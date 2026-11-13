# Living World Engine — World Event and History Model

**Status:** Phase 1 core model
**Campaign start:** 1 Harvestfall, 243 AC

## Purpose

This model provides durable history for meaningful changes in the world.

The event history is not a list of dramatic happenings. Administrative work, delayed trade, unresolved negotiations, successful harvests, and other meaningful non-events can be recorded when they change world state.

## Event identity

Every world event should contain:

- Event ID
- Date or date range
- Event type
- Status
- Actors
- Location or scope
- Cause
- Action
- Resolution
- Consequences
- Affected state records
- Information / visibility
- Source
- Commit reference

## Event types

Use only categories supported by the event:

political, diplomatic, military, economic, agricultural, environmental, religious, civic, social, infrastructure, legal, informational, travel/logistics, discovery, player consequence, and correction.

## Causality

Every meaningful event distinguishes:

- **Cause:** established condition, actor decision, player action, environmental condition, or passage of time.
- **Action:** what actually happened.
- **Resolution:** what resulted.
- **Consequence:** what changed afterward.

Do not backfill a cause simply because an event would be more interesting with one.

## Event status

Use PROPOSED, APPROVED, OBSERVED, SUPERSEDED, or CORRECTED.

A proposed event is not history. An observed player event becomes history from the point it occurs in play. An approved world-engine result becomes historical simulation output.

## Event chain

**Prior state → cause → action → resolution → consequence → new state**

Later events may cite earlier event IDs.

Do not rewrite earlier history silently.

## Non-events

A turn may legitimately produce no major event. The record can state that no new conflict occurred, an existing negotiation remained unresolved, a project continued without meaningful change, ordinary trade or administration continued, or no evidence justified escalation.

This prevents the engine from manufacturing drama merely because a turn exists.

## Corrections

If an event conflicts with established canon:

1. preserve the original record;
2. mark it superseded;
3. record the reason;
4. create the corrected state;
5. continue from the corrected state.

The correction becomes part of the history record.

## Turn relationship

Turn records summarize a period. Individual events provide traceable units of change.

A turn should link to starting state, evaluated events, accepted events, unresolved proposals, resulting state, and commit.

The repository is the persistent history of the simulation.
