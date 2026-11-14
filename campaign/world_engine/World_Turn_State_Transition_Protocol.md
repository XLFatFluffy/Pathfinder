# World Turn State Transition Protocol

**Status:** Phase 5 operational procedure established  
**Purpose:** Make world-state advancement repeatable without turning the World Engine into an autonomous event generator.

## 1. Start from recorded state

Load the exact previous world_state.json and identify:

- in-world date;
- active actors;
- active issues;
- active projects;
- economic, military, diplomatic, environmental, and project conditions;
- discoveries;
- world forks;
- unresolved unknowns.

Do not reconstruct the state from memory.

## 2. Establish the turn window

Record:

- turn ID;
- start date;
- end date;
- reason for advancement;
- whether PCs were active during the interval;
- starting-state commit.

A turn may be a scheduled review, downtime interval, session-end review, or a GM-directed consequence review.

## 3. Evaluate only active pressure

For each relevant actor or system:

objective → information → resources → constraints → opportunity → available action

Do not force every actor to act every turn.

## 4. Resolve actions

For each action:

intent → capability → opposition → constraint → outcome

Use the smallest sufficient resolution.

Do not invent numerical values when qualitative resolution is enough.

## 5. Apply consequences

Update only records actually affected.

Possible changes include:

- issue status;
- project progress;
- relationship condition;
- economic pressure;
- military readiness;
- environmental condition;
- actor knowledge;
- public information;
- discovery records;
- world forks;
- new event records.

## 6. Check for secondary effects

A consequence may create a new condition elsewhere.

Example:

A delayed grain shipment can affect:

1. the originating merchant;
2. a receiving settlement;
3. prices or supply pressure;
4. a political dispute;
5. a military provisioning project.

Only create downstream effects when the source records support the connection.

## 7. Preserve uncertainty

If the turn produces insufficient evidence to determine an outcome:

- leave it unresolved;
- record competing possibilities if materially relevant;
- create a discovery record only if information could plausibly establish the answer;
- create a world fork only if materially different futures are actually emerging.

## 8. Record non-events

A significant actor choosing not to act can be historically relevant when:

- an expected action was considered but rejected;
- a constraint prevented action;
- an issue remained unresolved despite pressure;
- a deadline or opportunity passed.

Do not manufacture events to make the report interesting.

## 9. Commit before the next turn

The completed turn must produce:

1. a world-turn report;
2. updated state;
3. any required event records;
4. validation of machine-readable JSON;
5. a Git commit.

The next turn begins from that committed state.

## 10. Corrections

If a result later conflicts with established canon:

- preserve the historical turn;
- mark the result superseded;
- record the reason;
- create the corrected state;
- continue from the corrected state.

## 11. Player-event intake

When a PC action changes the wider world, create a boundary event rather than silently editing unrelated world records.

The boundary event should identify:

- what the PC actually did;
- what was objectively established;
- who witnessed or learned it;
- what remains uncertain;
- which world actors can plausibly respond;
- what state records may change.

## 12. Quiet turns remain valid

No material world change is a valid outcome.

The World Engine exists to preserve continuity, not to manufacture drama.
