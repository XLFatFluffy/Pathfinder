# Solo Campaign Recordkeeping — Design and Privacy Boundary

**Status:** Recordkeeping guidance; no player campaign records belong in this public repository.

Each player should have an independent solo campaign record maintained in the campaign application or another access-controlled store. The public GitHub repository is the source of truth for approved shared setting canon, not a storage location for private player histories.

## Required separation

Each solo campaign should have its own stable campaign identifier and record set, including:

- Player and character identity
- Character sheet and approved build
- Current in-world date and location
- Session journal and recap
- Inventory, wealth, encumbrance, and equipment changes
- NPC relationships and reputation
- Quests, promises, debts, clues, and discoveries
- Companions, mounts, and other associated records
- Consequential choices and world-state effects
- Open threads and next-session continuity notes
- Rules amendments and rulings that apply to this campaign

## Privacy requirements

- A player may read and update only their own private campaign records, subject to GM permissions.
- The GM may access all campaign records needed to adjudicate and maintain continuity.
- One player must never receive another player's private journal, character secrets, or campaign state.
- Shared canon and player-facing discoveries must be deliberately separated from GM-only truths.
- Access must be enforced by the application/database authorization layer, not by hiding links or relying on filenames.
- Do not place private campaign records, secret GM notes, credentials, or personal information in this repository while it is public.

## Shared-world continuity

Solo adventures use the same established world, calendar, geography, and canon. A player's actions may create consequences in the shared world, but those consequences become shared canon only when they occur in play and are adjudicated by the GM.

Private discoveries remain private to that character until the character shares them in-world or the GM otherwise makes them public. Separate campaign timelines must not silently overwrite one another; conflicting or world-changing events require GM adjudication.

## Implementation note

The application should use per-campaign membership and row-level database authorization for private campaign data. GM access should be explicit and auditable. Public GitHub files should contain only approved shared canon, public player materials, and non-sensitive templates.
