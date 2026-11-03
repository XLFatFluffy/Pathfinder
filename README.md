# Pathfinder

Pathfinder is a desktop-first campaign management application for a custom Pathfinder First Edition world. It is built around the requirements in the "PATHFINDER WORLD ATLAS & WORLD SIMULATOR" brief and uses a Node.js + Express + SQLite stack.

## Current features

Included so far:
- Express server serving a local desktop web app
- SQLite database with persistent campaign settings and core entity tables
- Hierarchical map library with local image artwork import and replacement
- Offline Leaflet atlas viewer with pan, zoom, fit-to-map, and hierarchy navigation
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

Map markers and linked location panels are the next atlas feature.
