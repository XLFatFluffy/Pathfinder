# Pathfinder

Pathfinder is a desktop-first campaign management application for a custom Pathfinder First Edition world. It is built around the requirements in the "PATHFINDER WORLD ATLAS & WORLD SIMULATOR" brief and uses a Node.js + Express + SQLite stack.

## Current features

Included so far:
- Express server serving a local desktop web app
- SQLite database with persistent campaign settings and core entity tables
- Hierarchical map library with local image artwork import and replacement
- Offline Leaflet atlas viewer with pan, zoom, fit-to-map, and hierarchy navigation
- Noble House profiles with political, historical, and GM-only notes
- NPC, faction, shop, quest, journal, timeline, and world-simulation records
- Player discovery log with a GM-controlled player-known status
- Custom campaign calendar with reviewed event-table simulation and timeline approval
- Local database backups that include imported map artwork
- Global search foundation for campaign records
- Basic fantasy-themed interface reflecting the World Atlas identity

## Run locally

1. Install dependencies:
   npm install
2. Start the app:
   npm start
3. Open the application in the default browser at:
   http://localhost:3000

## Project structure

- `server.js` — Express server and API routes
- `src/db.js` — SQLite database initialization and persistence helpers
- `public/` — static web UI and client logic
- `data/pathfinder.db` — local SQLite database file
- `data/maps/` — imported map artwork
- `backups/` — local database backups and companion artwork folders

## Atlas maps

The **World Atlas** opens the selected imported image in Leaflet using `CRS.Simple`. Pan and zoom the artwork, fit it to the viewport, and move between maps using the hierarchy selector and breadcrumbs. Leaflet is served locally, so the viewer does not require an internet connection.

Open **Map Library** to add and organize world, continent, region, kingdom, city, settlement, interior, and dungeon maps. Artwork supports PNG, JPEG, WebP, and GIF files up to 100 MB. Parent maps form a hierarchy; replacing artwork preserves the map record and its links. Maps cannot be deleted while child maps or locations reference them.

Add markers directly to a map to create or link locations. Markers use normalized image coordinates, so they remain in place when artwork is replaced or resized. Markers can be moved, categorized, and linked to the same location across multiple maps.

The Locations panel stores the location name and type, player-visible description and visibility, and GM-only notes separately. Locations can be edited from the map marker or the campaign list; maps and locations with active dependencies are protected from deletion.

The **Noble Houses** panel records house identity, heraldry description, motto, history, ruler and seat, holdings, resources, influence, objectives, status, and GM-only secrets. Political relationships are tracked independently for each house pair, including alliances, rivalries, vassalage, war, marriage alliances, and blood relations. Editing a relationship appends a dated history entry instead of erasing its previous state. House deletion is blocked while NPCs or political relationships reference it. Relationship records and their history are part of the portable **Houses, NPCs, and factions** JSON category.

The **NPCs** panel includes a structured family list for parent/child, sibling, spouse, and former-spouse links. Each pair is stored once and displayed from either NPC's perspective; deleting an NPC removes its family links. Optional notes can capture context such as marriage or succession details. NPCs support suggested and GM-defined status labels; each status transition is recorded with its campaign date and optional reason, and can be reviewed from the profile. Family links and status history are part of the portable **Houses, NPCs, and factions** JSON category.

## Campaign journal and discoveries

The **Campaign Journal** stores session notes and a separate player-discovery log. Record rumors, known NPCs, discovered locations, acquired maps, and other information the party has learned. Entries default to **Unrevealed**; mark them **Player-known** when the information becomes known to the party. This is GM-side campaign bookkeeping only and does not create a player-facing display. Discovery entries are included in the campaign JSON export, so review them before sharing a file externally.

## Campaign calendar

Open **World Simulation** to set the current campaign date and define the calendar. Dates use `day-month-year` order, such as `1-01-0001`. Enter one month per line as `Month name: number of days`; the default calendar has twelve 30-day months.

Use the time controls to advance by days, weeks, months, years, or a custom number of days. Each advance saves the new date and records the previous date, new date, interval, and time in **Simulation cycles**. Month and year advances keep the current day when possible, and use the final day of a shorter destination month when needed.

Each event table has a group name and one or more possible outcomes. On each time advance, the app rolls once per group. Give every outcome in a group a numeric range (for example `1-20` and `21-100`) to roll against that range, or leave every range in the group blank to choose by relative weight. Ranges must not overlap; a gap is recorded as a roll with no selected outcome. Misconfigured groups prevent the date from advancing until corrected.

Generated outcomes are suggestions, not canon. Review each result to edit, approve it into the campaign timeline, reject it without changing established campaign information, or postpone it for later review. The cycle history records the dates, interval, every roll, the selected outcome, and its decision. Advanced state-based modifiers and consequence previews remain deferred.

## Campaign JSON for AI-assisted review

The app does not connect to an AI service. To get campaign help, open **Settings & Data Management** and download a campaign JSON file to share with the tool you choose.

The export is versioned (`pathfinder-campaign`, schema version 1), includes an export timestamp, settings, stable record IDs, and the original ID references between records. Choose one or more categories, or leave all categories selected for a full export. Map artwork is not embedded and local file paths are omitted; preserve map images separately with a database backup.

Exports include GM-only material, including house secrets, private location/shop/NPC notes, and unrevealed discoveries. Review the file and the privacy policy of any external tool before sharing it. Consider exporting only the categories needed for a specific question.

To merge a JSON export (up to 24 MB), choose it under **Import a campaign JSON file** and select **Validate and preview**. Review the new records, duplicates, conflicts, and setting differences before confirming the import. Existing records are never overwritten: matching records are skipped, conflicting IDs are reported, and records with unresolved references are not imported. Differing settings are kept unless **Replace settings that differ** is explicitly selected. Imports are additive; use a database backup before a large merge.

The JSON export is intended for review and handoff, not as a substitute for a backup. Use **Create backup** to preserve the SQLite database together with imported map artwork.
