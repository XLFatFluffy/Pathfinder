# Pathfinder

Pathfinder is a campaign management application for a custom Pathfinder First Edition world. The amended product brief calls for a Next.js and Supabase cloud app with separate GM and player workspaces. The original Express + SQLite app remains available during the incremental transition; no campaign data has been moved or removed.

## Current features

Included so far:
- Cloud foundation in `web/`: Next.js, Supabase Auth, GM/player route separation, and database-enforced campaign access
- Cloud map library and interactive atlas with map hierarchy, linked locations, pan/zoom, GM-managed markers and regions/routes, resumable artwork uploads/replacement, and player-shared maps
- Version-controlled Supabase migrations and RLS tests for journal, location, map, and marker access
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

### Cloud workspace

The cloud app runs on port 3001 so it can coexist with the existing local app on port 3000.

1. Install Docker Desktop (or Docker Engine) and Node.js 20.9 or newer.
2. From the repository root, start the local Supabase services:
   `npx supabase start`
3. Copy `web/.env.example` to `web/.env.local`. Replace the placeholder with the local API URL and anon/publishable key printed by the Supabase CLI.
4. Apply migrations with `npx supabase migration up`.
5. In Supabase Studio at `http://localhost:54323`, create the initial GM user. Open the SQL editor and assign that user's UUID to the seeded campaign:

   ```sql
   insert into public.campaign_members (campaign_id, user_id, role)
   select id, 'REPLACE-WITH-GM-USER-UUID'::uuid, 'gm'
   from public.campaigns
   where id = '00000000-0000-4000-8000-000000000001';
   ```

6. Install the cloud app's dependencies and start it:
   `npm --prefix web install`
   `npm run cloud:dev`
7. Open `http://localhost:3001` and sign in with the GM account.

Email signup is disabled in local Supabase configuration. The GM account is created administratively; players cannot register themselves or assign their own roles. The browser only receives the Supabase anon/publishable key. Do not put a service-role key in `web/.env.local` or any `NEXT_PUBLIC_` variable.

Run the cloud type check and production build with `npm run cloud:typecheck` and `npm run cloud:build`. Run the database RLS tests with `npx supabase test db`.

The cloud foundation now includes sign-in, GM/player route separation, journal visibility enforced by row-level security, linked location records, a private cloud map library, and an interactive atlas. The GM can create locations with parent links, player-facing descriptions, visibility settings, and private notes. Private location notes live in a separate table that players cannot read, even when the location itself is visible. The GM can upload and replace PNG, JPEG, WebP, or GIF maps up to 100 MB, connect them to locations, organize maps into a hierarchy, and control player visibility. The GM and players can explore accessible maps in the atlas with pan, zoom, fit-to-map, hierarchy navigation, and keyboard controls. GMs can place, edit, link, share, and remove normalized-coordinate map markers and draw, recolor, share, edit, and remove normalized-coordinate regions and routes. Row-level security keeps markers and overlays hidden when their map is hidden, and markers also respect linked location visibility. Artwork is kept in a private Supabase Storage bucket; shared maps use short-lived signed URLs and storage policies check campaign membership and map visibility. The existing atlas and campaign records remain in SQLite until their cloud equivalents and an explicit migration path are implemented and verified.

### Production deployment status

The cloud app is not yet deployed. When preparing a production project:

1. Create a Supabase project, sign in with `npx supabase login`, link it with `npx supabase link --project-ref <project-ref>`, then apply the checked-in migrations with `npx supabase db push`. Confirm the linked project before pushing migrations.
2. Disable public email signup in the production Supabase Auth settings. Create the initial GM account administratively, then add its UUID to `campaign_members` using the bootstrap SQL above. Do not expose a service-role key to the browser.
3. Create a Vercel project from this repository and set its root directory to `web`.
4. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel for the appropriate deployment environments.
5. Add the production domain and required preview URLs to Supabase Auth's allowed redirect URLs.
6. Before inviting players, verify private-record isolation using separate GM and player accounts. The local pgTAP tests are a baseline, not a substitute for checking each production role against the deployed policies.

No Supabase or Vercel credentials are present in this repository, so no hosted project has been created or deployed.

### Existing local app

1. Install dependencies:
   npm install
2. Start the app:
   npm start
3. Open the application in the default browser at:
   http://localhost:3000

## Project structure

- `web/` — Next.js cloud workspace and Supabase Auth integration
- `supabase/migrations/` — version-controlled cloud database schema and RLS policies
- `supabase/tests/database/` — database permission tests
- `server.js` — Express server and API routes
- `src/db.js` — SQLite database initialization and persistence helpers
- `public/` — static web UI and client logic
- `data/pathfinder.db` — local SQLite campaign database
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


## Campaign Records

Campaign reference material is being organized separately from the application code.

Planned structure:

- `campaign/`: Campaign Bible, world history, calendar, current world state, canon register, and source documents.
- `campaign/geography/`: continent, kingdoms, regions, cities, and locations.
- `campaign/politics/`: noble houses, political relationships, and succession.
- `campaign/people/`: NPCs and family records.
- `campaign/factions/`, `campaign/religions/`, and `campaign/creatures/`: organizations, religious institutions, and setting-specific lore.
- `campaign/maps/`: continent, kingdom, regional, and city map assets and metadata.
- `campaign/economy/`: shops, merchants, and trade routes.
- `campaign/player_characters/`: player-character records, with private information protected from player-facing exports.
- `sessions/`: session records and readable summaries.
- `world_events/`: active and historical world events.
- `changelog/`: approved campaign canon changes.

### Canon and privacy rules

Use the statuses PROPOSED, APPROVED, ESTABLISHED, REJECTED, REVISED, and UNRESOLVED. Brainstorming is not canon until explicitly approved. Preserve unresolved mysteries and flag contradictions rather than silently resolving them. Keep GM-only knowledge separate from player-facing discoveries.

The existing Campaign Bible and atlas are source material, not automatically final canon. The continent map remains provisional.