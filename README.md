# Pathfinder Campaign Atlas

The campaign app is the Next.js and Supabase cloud workspace in `web/`, deployed
on Vercel. Supabase is the live application database. Campaign source documents
and canon remain organized under `campaign/` and `sessions/`. The former local
Express/SQLite app has been retired.

## Features

- Separate GM and player workspaces with campaign access enforced by Supabase
  row-level security
- GM-managed locations, NPCs, noble houses and relationships, factions, quests,
  session recaps, and journal entries, with separate GM-only notes and
  player-sharing controls
- Player-owned character records and an embedded, editable Pathfinder 1e PDF
- Player character notes, shared atlas and maps, and a campaign reference
  library
- Preview-first, additive import for campaign locations, NPCs, houses and
  relationships, factions, quests, sessions, and journal entries
- Supabase migrations and database access tests

## Deployment and configuration

The Vercel project should use `web/` as its root directory. Configure
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the
deployment. Configure `SUPABASE_SERVICE_ROLE_KEY` only as a server-side secret;
never expose it through a `NEXT_PUBLIC_` variable.

The GM `/setup` page documents initial campaign membership setup. Before
applying migrations or importing campaign data, verify the target Supabase
project and review the current campaign backup.

Player accounts use a GM-assigned login ID. Player IDs are not secrets: anyone
who knows a player's ID may be able to impersonate that player and access their
private character records and notes. Limit access to the app URL and IDs, and
do not use player-private records for sensitive information.

## Importing campaign data

Use the GM workspace's **AI data import** page to upload
[`campaign/import/pathfinder_campaign_import.json`](./campaign/import/pathfinder_campaign_import.json).
The bundle contains 88 supported records. Review the validation preview,
source keys, links, GM-only content, and player visibility before confirming.
The import is additive; existing records are not overwritten. The importer
does not send campaign material to an AI service.

Keep the import bundle outside `web/public/`; it contains GM-only information.
Keep `campaign/` source material as the campaign canon source and make later
changes through the GM workspace.

## Character sheets

The player character list stores a character name, ancestry, class, and level
for campaign organization. Open a character to edit the supplied Pathfinder
character-sheet PDF in an in-app dialog. Form edits save automatically to the
character record and are restored when the sheet is reopened. The original PDF
remains unchanged and is available as a blank download. The old structured
character fields and migrations remain stored for existing records, but are no
longer part of the player or GM character UI. GM-only character notes remain
available in the GM roster.

## Development checks

From the repository root, run the cloud app's checks with:

```sh
npm --prefix web test
npm --prefix web run typecheck
npm --prefix web run build
```

Database policy tests run with `npx supabase test db` against the intended
Supabase test project.

## Campaign material

- `campaign/` — campaign canon, reference records, maps, and source documents
- `campaign/import/` — import template, preparation guide, and reviewed JSON
  bundle
- `sessions/` — session notes and handoff templates
- `web/` — Vercel-hosted app
- `supabase/migrations/` — version-controlled database schema and policies
- `supabase/tests/database/` — database permission tests
