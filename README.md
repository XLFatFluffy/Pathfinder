# Pathfinder

Pathfinder is a campaign management application for a custom Pathfinder First Edition world. The amended product brief calls for a Next.js and Supabase cloud app with separate GM and player workspaces. The original Express + SQLite app remains available during the incremental transition; no campaign data has been moved or removed.

## Current features

Included so far:
- Cloud foundation in `web/`: Next.js, Supabase Auth, GM/player route separation, and database-enforced campaign access
- GM-only, preview-first AI-prepared JSON import for campaign locations, NPCs, houses and relationships, factions, quests, sessions, and journal entries; the app does not send campaign material to an AI service
- Email-based password recovery with a Supabase PKCE callback and role-aware password updates
- Cloud campaign journal with GM create/edit/delete and player-visible entries
- Cloud locations with parent links, player descriptions, private GM notes, and guarded editing/deletion
- NPC profiles with player-known visibility, linked locations, GM-only notes, and dated status history
- Noble-house profiles with linked rulers and seats, player-facing descriptions, and isolated GM political details
- Dated noble-house relationships with separately managed player sharing and GM-only history
- Faction profiles with linked leaders and headquarters, GM-managed sharing, and separately protected faction intelligence
- Quest tracking with status, quest giver, linked location, player-facing summaries, and separate GM-only notes
- Numbered session logs with custom campaign dates, player-shared recaps, and separate GM-only notes
- Player-owned character sheets with per-player row isolation (player IDs are not secrets) and separate GM-only notes
- Structured Pathfinder 1e character workspaces for abilities, classes, skills, saves, combat, attacks, features, inventory, spellcasting, relationships, and history; the GM has a read-only review page with private notes
- Centralized, unit-tested calculations for ability modifiers, class skills, armor check penalties, saves, AC variants, initiative, CMB/CMD, weapon attacks, and spell DCs
- Player campaign dashboard with shared journal, discoveries, atlas, maps, and private per-player notes
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
3. Copy `web/.env.example` to `web/.env.local`. Set the local API URL, anon/publishable key, and service-role key printed by the Supabase CLI. Keep the service-role key server-only; never use a `NEXT_PUBLIC_` prefix.
4. Apply migrations with `npx supabase migration up`.
5. In Supabase Studio at `http://localhost:54323`, create the initial GM user. Open the SQL editor and assign that user's UUID to the seeded campaign:

   ```sql
   insert into public.campaign_members (campaign_id, user_id, role, login_id)
   select id, 'REPLACE-WITH-GM-USER-UUID'::uuid, 'gm', 'gm-login-id'
   from public.campaigns
   where id = '00000000-0000-4000-8000-000000000001';
   ```

6. Install the cloud app's dependencies and start it:
   `npm --prefix web install`
   `npm run cloud:dev`
7. Open `http://localhost:3001` and sign in with the GM account.

Email signup is disabled in local Supabase configuration. The GM account is created administratively; players cannot register themselves or assign their own roles. The browser only receives the Supabase anon/publishable key. Do not put a service-role key in `web/.env.local` or any `NEXT_PUBLIC_` variable.

Supabase Auth requires an email-shaped identifier, but the campaign does not use real email addresses. Create each account with a unique, non-deliverable placeholder such as `player-login-id@users.invalid`, and mark it confirmed. Password recovery emails are not available; an administrator resets the GM password in Supabase Authentication → Users. For local development, copy all values from `web/.env.example`.

Player accounts use a GM-assigned login ID without a password; the GM signs in with their assigned login ID and account password. Configure `SUPABASE_SERVICE_ROLE_KEY` as a server-only environment variable for the cloud app to issue player sessions. Never expose this key through a `NEXT_PUBLIC_` variable. Player login IDs are not secrets: anyone who knows a player's ID can impersonate that player and access that player's private sheets and notes. Keep the app URL and IDs limited to the intended group, and do not use player-private records for sensitive information.

When Supabase is configured, the app's `/setup` page provides the account-
provisioning steps and SQL for assigning the first GM and players. Apply the
login-ID migration first, then run the SQL from the Supabase Dashboard's SQL
Editor. Login IDs must be unique and 3–32 lowercase letters, numbers, dots,
underscores, or hyphens.

To add a player, create their account administratively in Supabase Auth, then assign it to the campaign as a player:

```sql
insert into public.campaign_members (campaign_id, user_id, role, login_id)
select id, 'REPLACE-WITH-PLAYER-USER-UUID'::uuid, 'player', 'player-login-id'
from public.campaigns
where id = '00000000-0000-4000-8000-000000000001';
```

Players sign in with their assigned login ID and no password; the GM signs in
with their login ID and password. Anyone who knows a player ID can impersonate
that player, including accessing their player-specific sheets and notes.

Run the combined local and cloud unit tests with `npm test`. Run the cloud type check and production build with `npm run cloud:typecheck` and `npm run cloud:build`. Run the database RLS tests with `npx supabase test db`.

To enter organized campaign records, use the GM workspace's **AI data import** page. The AI preparation guide and empty versioned JSON template are available there and in [`campaign/import/`](campaign/import/README.md). Keep repository Markdown as the campaign source of truth; review every record's provenance, canon status, and visibility before importing. Imports are additive, and changes to imported records should be made through the GM workspace.

The cloud foundation includes sign-in, GM/player route separation, journal visibility enforced by row-level security, linked location records, a private cloud map library, and an interactive atlas. GMs can create, edit, and delete journal entries and choose whether each entry is player-visible. Player accounts get their own campaign dashboard, shared journal, session history, discoveries, known-NPC directory, known-house directory, known-faction directory, shared quest board, atlas, map library, character sheets, and personal notes. Player login IDs are not secrets: anyone who knows a player's ID can impersonate that player and access that player's sheets and notes, so do not treat player-private records as confidential. Each player can manage multiple character sheets; the original freeform fields remain available during the transition while the structured workspace stores and calculates normalized Pathfinder records. The supplied editable character PDF remains the canonical template, but PDF import/export is not yet available: its XFA form uses generic field names, and a destructive rewrite could discard its form data. The GM can review structured campaign sheets and add separate GM-only notes without editing player-owned sheets. Session logs record numbered sessions and custom campaign dates, with shared recaps separated from GM-only notes. The NPC directory lets GMs record character details, link a location, decide when an NPC is known to players, keep private notes separate, and review dated status changes.

The character calculator derives ability modifiers, trained class-skill bonuses, armor-check penalties, saving throws, AC/touch/flat-footed AC, initiative, CMB/CMD, attack totals, damage modifiers, and spell DCs from stored inputs. Base attack bonus, save base bonuses, armor components, and miscellaneous modifiers remain editable inputs; the app does not infer missing class progressions or calculate hit-point advancement. Enter touch-spell attacks in the regular attack list with the appropriate attack ability rather than relying on a universal spell-attack bonus.

The character schema migrations have been applied and tested against the local Supabase stack only. Do not apply them to the hosted project until its target, backups, and deployment configuration have been confirmed. No cloud migration was applied to the hosted project as part of this work. Players can only read NPC profiles the GM has shared; private notes and status history are protected by database policies. Noble-house profiles store player-facing heraldry, motto, and descriptions separately from GM-only founding history, rulers, seats, holdings, succession, resources, objectives, and secrets. Rulers and ancestral seats use relational links to NPC and location records, and the player workspace can only access houses the GM has shared. Directed house relationships record alliances, rivalries, vassalage, war, marriage alliances, and blood relations. Each pair is recorded once, relationship changes retain a dated GM-only history, and the GM can independently choose whether each relationship is player-visible; players only see shared relationships between houses they already know. Faction profiles let GMs link an optional leader and headquarters, share a public description, and maintain objectives, resources, influence, membership, allies and rivals, activities, history, and secrets in a separately protected GM-only record. Players see only factions explicitly shared by their GM and can access a linked leader or headquarters only when those records are also player-visible. Quest tracking lets GMs manage story threads, statuses, quest givers, and linked locations, with explicit player sharing and GM-only notes stored separately; players see only quests their GM has shared. GMs can create and edit locations with parent links, player-facing descriptions, visibility settings, and private notes; private location notes live in a separate table that players cannot read, even when the location itself is visible. Parent cycles are rejected, and locations with child, map, or NPC references cannot be deleted. The GM can upload and replace PNG, JPEG, WebP, or GIF maps up to 100 MB, connect them to locations, organize them into a hierarchy, and control player visibility. The GM and players can explore accessible maps in the atlas with pan, zoom, fit-to-map, hierarchy navigation, and keyboard controls. GMs can place, edit, link, share, and remove normalized-coordinate map markers and draw, recolor, share, edit, and remove normalized-coordinate regions and routes. Row-level security keeps markers and overlays hidden when their map is hidden, and markers also respect linked location visibility. Artwork is kept in a private Supabase Storage bucket; shared maps use short-lived signed URLs and storage policies check campaign membership and map visibility. The existing atlas and campaign records remain in SQLite until their cloud equivalents and an explicit migration path are implemented and verified.

### Production deployment status

The cloud app is deployed to Vercel; finish the following setup before using it:

1. Confirm the linked Supabase project and migration history with `npx supabase migration list`. Apply any pending checked-in migrations only after verifying the target project.
2. Disable public email signup in the production Supabase Auth settings. Create the GM and player accounts administratively, then assign each a unique `login_id` in `campaign_members` using the SQL examples on `/setup`. Do not expose a service-role key to the browser.
3. Create a Vercel project from this repository and set its root directory to `web`.
4. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel for the appropriate deployment environments. Add `SUPABASE_SERVICE_ROLE_KEY` as a server-only secret environment variable; never prefix it with `NEXT_PUBLIC_`.
5. Disable public email signup in Supabase Auth. Email delivery and `/auth/callback` allowlisting are not required for the placeholder-address account flow.
6. Before inviting players, verify private-record isolation using separate GM and player accounts. The local pgTAP tests are a baseline, not a substitute for checking each production role against the deployed policies.

The Supabase database is hosted. No service-role key is stored in this repository.

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