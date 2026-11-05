# Preparing Pathfinder campaign data for import

This app does not send campaign information to an AI service. Use an AI tool
you trust to prepare a JSON file from the selected source records, then review
the result yourself before uploading it in **GM workspace → AI data import**.

Start with `campaign-import-template.json`. Keep its `format`, `version`, and
record collection names unchanged. The importer accepts locations, NPCs,
noble houses, house relationships, factions, quests, sessions, and journal
entries. Maps and artwork are added through the map library.

## Reusable AI instruction

> Read only the campaign source material I provide. Convert supported campaign
> entities into a JSON object matching the attached Pathfinder import template.
> Return JSON only: no Markdown fences or commentary. Do not invent details,
> resolve open questions, rename entities, reconcile contradictions, or turn
> rumors and beliefs into facts. Keep uncertainty explicit in descriptions and
> notes. Give every record a stable, unique `key` using lowercase letters,
> numbers, periods, underscores, or hyphens; use those keys for links. Cite the
> exact source file and section in each record's `provenance`. Use the source's
> canon status when explicit; otherwise use `PROPOSED`. Default visibility to
> `GM_ONLY` unless the source explicitly authorizes player sharing. Keep
> secrets, private motives, hidden routes, GM truth, and unresolved answers in
> GM-only fields. Put only appropriate player-facing content in public
> descriptions. Preserve all facts that fit the schema. If information does
> not fit a supported field, stop and list it separately instead of omitting it
> or forcing it into an unrelated field.

## Record rules

Every record requires:

- `key`: stable source identity; keep it unchanged when regenerating a package.
- `canon_status`: `PROPOSED`, `APPROVED`, `ESTABLISHED`, `REJECTED`,
  `REVISED`, or `UNRESOLVED`.
- `visibility`: `GM_ONLY` or `PLAYER_SHARED`. Unresolved, proposed, rejected,
  GM-truth, and proposal records cannot be player-shared.
- `knowledge_type`: `fact`, `rumor`, `belief`, `discovery`, `gm_truth`, or
  `proposal`.
- `provenance`: repository-relative file and section, such as
  `campaign/locations/starting_city/City_Overview.md#Current-canon`.

Links use the other record's `key`: `parent_key`, `location_key`,
`current_ruler_key`, `ancestral_seat_key`, `leader_key`,
`headquarters_key`, `house_key`, and `related_house_key`. Include referenced
records in this file or use a key from an earlier import.

Player sharing maps to the app's existing row-level visibility control. The
separate provenance record preserves the finer-grained canon/knowledge
metadata for GM review. NPC status transitions, house relationship changes,
and campaign sessions receive dated history records through the app's existing
save functions when applicable.

## Safe handling

- The import is additive. It does not update or delete existing campaign data.
- Previously imported `type:key` pairs are skipped without overwrite.
- An existing record with the same name but a new key is a conflict; resolve it
  in the GM workspace before importing.
- Unknown fields and unresolved links are errors, not silently discarded data.
- A database error can stop a larger package part-way through. The UI lists
  completed keys; retrying the same file skips those records.
- Never include player passwords or service-role credentials in an import.
- Review every player's visibility and GM-only notes before confirming.
