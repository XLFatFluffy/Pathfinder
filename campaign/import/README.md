# AI-assisted campaign data import

Use the cloud GM workspace's **AI data import** page to load structured
campaign records without typing every field into an individual form.

- [AI preparation guide](../../web/public/campaign-import-guide.md) contains
  the reusable prompt and record-handling rules.
- [Empty JSON template](../../web/public/campaign-import-template.json) is the
  starter package.
- [Prepared campaign canon bundle](./pathfinder_campaign_import.json) is the current
  import-ready package generated from the organized database records.

## Source-of-truth and review

The campaign Markdown records and preserved source documents remain the
campaign/canon source. Supabase stores the live app state. The repository does
not currently contain a checked-in SQLite campaign database file; the earlier
local app's `data/` database path is ignored and is not present in this
workspace snapshot. Treat the organized campaign records as the source for
imports unless a separate database file is supplied.

The importer does not call an AI service. Prepare JSON with a tool chosen by
the GM, then validate the file in the cloud app. It rejects unsupported fields,
invalid visibility/canon combinations, and unresolved references. It shows
the records and visibility before the GM confirms. It only creates records;
existing imports are not overwritten. Keep each record's key stable when
regenerating a file. Changes after import should be made through the GM forms.

The initial format supports locations, NPCs, houses and relationships,
factions, quests, sessions, and journal entries. Map metadata/artwork and other
unsupported campaign entities must remain in their current workflows until the
format is extended and tested.
