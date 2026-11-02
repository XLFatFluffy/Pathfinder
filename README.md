# Pathfinder

Pathfinder is a desktop-first campaign management application for a custom Pathfinder First Edition world. It is built around the requirements in the "PATHFINDER WORLD ATLAS & WORLD SIMULATOR" brief and uses a Node.js + Express + SQLite stack.

## Current foundation

This repository currently contains the first build milestone: the application foundation.

Included:
- Express server serving a local desktop web app
- SQLite database with persistent campaign settings and core entity tables
- Local backup creation and backup history tracking
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
- `backups/` — automatic local backups of the campaign database

## Planned next phases

- Phase 2: world atlas map import and Leaflet-based interactive map viewer
- Phase 3: noble houses, NPCs, factions, and relationship model
- Phase 4: journal, quest, and timeline management
- Phase 5: shops, inventories, and merchant systems
- Phase 6: simple world simulation with GM approval workflow
- Phase 7: export/import validation and backup restore
- Phase 8: player display mode
