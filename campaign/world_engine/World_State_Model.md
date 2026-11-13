# Living World Engine — World-State Model

**Status:** Phase 1 core model
**Campaign start:** 1 Harvestfall, 243 AC

## Purpose

The world-state model records the current condition of the campaign world without requiring every detail to be numerical.

It is a structured view over established campaign records, not a replacement for those records.

## State domains

### Locations
Track established settlement identity, geographic relationships, political authority, jurisdiction, holdings, infrastructure, current issues, projects, known resources, and relevant seasonal conditions.

Exact coordinates, borders, routes, and map geometry remain controlled by authoritative map records.

### Political authority
Track office or authority, holder, scope, legitimacy, obligations, dependencies, and unresolved disputes.

Do not equate title with effective control.

### Resources
Track only resources supported by campaign records. Useful qualitative states include scarce, adequate, strong, strained, improving, declining, and unknown.

Numerical values require an established source or explicit approval.

### Relationships
Track parties, relationship type, current condition, supporting evidence, pressures, last meaningful change, visibility, and unresolved questions.

### Issues
An issue is an active condition or unresolved pressure. It is not automatically a quest, countdown, crisis, or conspiracy.

Minimum fields:

- issue ID
- title
- status
- actors
- location
- established facts
- pressures
- unknowns
- possible paths
- escalation conditions
- source records
- last review

### Projects
Track owner, objective, status, dependencies, resources, constraints, expected time scale, recent progress, blockers, and consequences.

Projects are not automatic countdowns.

### Conditions
Conditions describe meaningful temporary or persistent states such as damaged, delayed, under review, disputed, constrained, recovering, or stable. Each condition requires a cause or source.

## State transition

**Previous state → elapsed time / player event → actor evaluation → system effects → new state**

Record meaningful changes only. A lack of change is valid world history.

## Provenance

Every meaningful state change should be traceable to:

- established canon
- observed play
- approved GM decision
- recorded world-engine result
- explicit correction

A proposal must not be stored as established state merely because it is plausible.

## Current-state snapshot

A future machine-readable snapshot should group state by actors, locations, authority, resources, relationships, issues, projects, conditions, calendar, unresolved unknowns, and recent events.

The snapshot is a convenience layer. Dedicated source records remain authoritative.

## Unknown handling

Use UNKNOWN when the campaign has not established a value, UNRESOLVED when an active question exists, PROVISIONAL for an unapproved working value, GM-ONLY for established concealed information, and RUMOR for an in-world claim.

Never convert unknown into a numerical estimate merely to make a record complete.

## Geography safeguard

World state may record that a political, economic, military, or social relationship exists without creating map geometry.

Political changes do not automatically create borders. Economic routes do not automatically create roads. Military movement does not automatically create permanent routes.

Authoritative artwork and calibrated map records control geography.
