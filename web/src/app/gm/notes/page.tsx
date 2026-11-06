import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import {
  CAMPAIGN_NOTE_CATEGORIES,
  type CampaignNoteLink,
  type CampaignNoteLinkType,
} from "@/lib/campaign-notes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";
import CampaignNoteForm, { type CampaignNoteValue } from "./note-form";

export const dynamic = "force-dynamic";

type NoteSearchParams = {
  q?: string | string[];
  category?: string | string[];
  tag?: string | string[];
  pinned?: string | string[];
};

function firstValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export default async function GmNotesPage({
  searchParams,
}: {
  searchParams: Promise<NoteSearchParams>;
}) {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return null;
  }

  const params = await searchParams;
  const query = firstValue(params.q).slice(0, 120).toLocaleLowerCase();
  const categoryFilter = firstValue(params.category);
  const tagFilter = firstValue(params.tag).toLocaleLowerCase();
  const pinnedOnly = firstValue(params.pinned) === "true";
  const validCategory = CAMPAIGN_NOTE_CATEGORIES.some(
    (category) => category.value === categoryFilter,
  )
    ? categoryFilter
    : "";

  const supabase = await createSupabaseServerClient();
  const [
    entries,
    links,
    locations,
    npcs,
    houses,
    factions,
    quests,
    sessions,
    events,
    maps,
  ] = await Promise.all([
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_journal_entries")
        .select(
          "id, title, content, campaign_date, category, tags, pinned, player_visible, created_at, updated_at",
        )
        .eq("campaign_id", member.campaign_id)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false })
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_journal_entry_links")
        .select(
          "entry_id, location_id, npc_id, house_id, faction_id, quest_id, session_id, event_id, map_id",
        )
        .eq("campaign_id", member.campaign_id)
        .order("entry_id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_locations")
        .select("id, name")
        .eq("campaign_id", member.campaign_id)
        .order("name")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_npcs")
        .select("id, name")
        .eq("campaign_id", member.campaign_id)
        .order("name")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_houses")
        .select("id, name")
        .eq("campaign_id", member.campaign_id)
        .order("name")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_factions")
        .select("id, name")
        .eq("campaign_id", member.campaign_id)
        .order("name")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_quests")
        .select("id, name")
        .eq("campaign_id", member.campaign_id)
        .order("name")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_sessions")
        .select("id, session_number")
        .eq("campaign_id", member.campaign_id)
        .order("session_number", { ascending: false })
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_events")
        .select("id, title")
        .eq("campaign_id", member.campaign_id)
        .order("title")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_maps")
        .select("id, name")
        .eq("campaign_id", member.campaign_id)
        .order("name")
        .order("id")
        .range(from, to),
    ),
  ]);

  const optionsByType = {
    location: locations,
    npc: npcs,
    house: houses,
    faction: factions,
    quest: quests,
    session: sessions.map((session) => ({
      id: session.id,
      name: `Session ${session.session_number}`,
    })),
    event: events.map((event) => ({ id: event.id, name: event.title })),
    map: maps,
  } as const;
  const linkGroups: {
    type: CampaignNoteLinkType;
    label: string;
    options: { id: string; name: string }[];
  }[] = [
    { type: "quest", label: "Quests", options: optionsByType.quest },
    { type: "npc", label: "NPCs", options: optionsByType.npc },
    { type: "location", label: "Locations", options: optionsByType.location },
    { type: "house", label: "Houses", options: optionsByType.house },
    { type: "faction", label: "Factions", options: optionsByType.faction },
    { type: "event", label: "Calendar events", options: optionsByType.event },
    { type: "session", label: "Sessions", options: optionsByType.session },
    { type: "map", label: "Map library", options: optionsByType.map },
  ] as const;

  const nameByLink = new Map<string, string>();
  for (const [type, records] of Object.entries(optionsByType)) {
    for (const record of records) {
      nameByLink.set(`${type}:${record.id}`, record.name);
    }
  }

  const linksByEntryId = new Map<string, CampaignNoteLink[]>();
  for (const linkRow of links) {
    const targets = [
      ["location", linkRow.location_id],
      ["npc", linkRow.npc_id],
      ["house", linkRow.house_id],
      ["faction", linkRow.faction_id],
      ["quest", linkRow.quest_id],
      ["session", linkRow.session_id],
      ["event", linkRow.event_id],
      ["map", linkRow.map_id],
    ] as const;
    const target = targets.find(([, recordId]) => recordId !== null);
    if (!target || !target[1]) {
      continue;
    }
    const itemLinks = linksByEntryId.get(linkRow.entry_id) ?? [];
    itemLinks.push({ type: target[0], id: target[1] });
    linksByEntryId.set(linkRow.entry_id, itemLinks);
  }

  const filteredEntries = entries.filter((entry) => {
    const entryTags: string[] = Array.isArray(entry.tags)
      ? entry.tags.filter((tag): tag is string => typeof tag === "string")
      : [];
    const matchesQuery =
      !query ||
      entry.title.toLocaleLowerCase().includes(query) ||
      entry.content.toLocaleLowerCase().includes(query) ||
      entryTags.some((tag) => tag.toLocaleLowerCase().includes(query));
    const matchesTag =
      !tagFilter || entryTags.some((tag) => tag.toLocaleLowerCase() === tagFilter);
    return (
      matchesQuery &&
      matchesTag &&
      (!validCategory || entry.category === validCategory) &&
      (!pinnedOnly || entry.pinned)
    );
  });

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Knowledge ledger</p>
          <h2>GM notes and journal</h2>
        </div>
        <Link href="/gm">Return to overview</Link>
      </div>
      <p className="muted">
        Create Markdown notes, organize them with categories and tags, pin important references, and link notes directly to campaign records or map assets. Player sharing remains explicit.
      </p>

      <CampaignNoteForm linkGroups={[...linkGroups]} />

      <section className="entry-list" aria-labelledby="notes-search-heading">
        <div className="section-heading">
          <h3 id="notes-search-heading">Find notes</h3>
          <span className="muted">
            Showing {filteredEntries.length} of {entries.length}
          </span>
        </div>
        <form action="/gm/notes" className="note-search-form" method="get">
          <label>
            Search notes
            <input
              defaultValue={firstValue(params.q)}
              maxLength={120}
              name="q"
              placeholder="Search titles, content, or tags"
              type="search"
            />
          </label>
          <label>
            Category
            <select defaultValue={validCategory} name="category">
              <option value="">All categories</option>
              {CAMPAIGN_NOTE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tag
            <input
              defaultValue={firstValue(params.tag)}
              maxLength={40}
              name="tag"
              placeholder="Exact tag"
            />
          </label>
          <label className="checkbox-label">
            <input
              defaultChecked={pinnedOnly}
              name="pinned"
              type="checkbox"
              value="true"
            />
            Pinned only
          </label>
          <div className="note-search-actions">
            <button type="submit">Search</button>
            <Link href="/gm/notes">Clear filters</Link>
          </div>
        </form>
      </section>

      <section className="entry-list" aria-labelledby="notes-list-heading">
        <h3 id="notes-list-heading">Notes</h3>
        {filteredEntries.length ? (
          filteredEntries.map((entry) => {
            const noteLinks = linksByEntryId.get(entry.id) ?? [];
            const noteTags: string[] = Array.isArray(entry.tags)
              ? entry.tags.filter((tag): tag is string => typeof tag === "string")
              : [];
            const note: CampaignNoteValue = {
              ...entry,
              tags: noteTags,
              links: noteLinks,
            };
            const categoryLabel =
              CAMPAIGN_NOTE_CATEGORIES.find(
                (category) => category.value === entry.category,
              )?.label ?? "Unsorted";
            return (
              <article className="entry-card" key={entry.id}>
                <p className="eyebrow">
                  {entry.pinned ? "Pinned · " : ""}
                  {entry.player_visible ? "Player-visible" : "GM-only"} · {categoryLabel}
                </p>
                <h4>{entry.title}</h4>
                <p className="muted">
                  {entry.campaign_date ? `${entry.campaign_date} · ` : ""}
                  Created {new Date(entry.created_at).toLocaleString()} · Updated{" "}
                  {new Date(entry.updated_at).toLocaleString()}
                </p>
                {noteTags.length ? (
                  <p className="note-tags">
                    {noteTags.map((tag) => (
                      <Link
                        className="note-tag"
                        href={`/gm/notes?tag=${encodeURIComponent(tag)}`}
                        key={tag}
                      >
                        {tag}
                      </Link>
                    ))}
                  </p>
                ) : null}
                <p className="entry-content">{entry.content}</p>
                {noteLinks.length ? (
                  <ul className="note-linked-records">
                    {noteLinks.map((noteLink) => (
                      <li key={`${noteLink.type}:${noteLink.id}`}>
                        <strong>{noteLink.type}:</strong>{" "}
                        {nameByLink.get(`${noteLink.type}:${noteLink.id}`) ??
                          "Linked campaign record"}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <details className="entry-edit">
                  <summary>Edit or delete this note</summary>
                  <CampaignNoteForm note={note} linkGroups={[...linkGroups]} />
                </details>
              </article>
            );
          })
        ) : (
          <p className="notice">
            {entries.length
              ? "No notes match these filters."
              : "No campaign notes have been added yet."}
          </p>
        )}
      </section>
    </>
  );
}
