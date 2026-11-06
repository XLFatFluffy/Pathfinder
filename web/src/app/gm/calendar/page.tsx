import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  CAMPAIGN_FESTIVALS,
  CAMPAIGN_WEEKDAYS,
  CURRENT_IN_WORLD_DATE,
  buildCampaignMonthView,
  campaignDateSortValue,
} from "@/lib/campaign-calendar";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";
import CampaignEventForm, { type CampaignEventValue } from "./event-form";

export const dynamic = "force-dynamic";

export default async function GmCalendarPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [
    recentSessions,
    { data: journalEntries, error: journalError },
    events,
    eventNotes,
    { data: history, error: historyError },
    locations,
    npcs,
    houses,
    factions,
    quests,
  ] = await Promise.all([
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_sessions")
        .select("id, session_number, campaign_date, summary")
        .eq("campaign_id", member.campaign_id)
        .order("session_number", { ascending: false })
        .order("id")
        .range(from, to),
    ),
    supabase
      .from("campaign_journal_entries")
      .select("id, title, campaign_date, created_at")
      .eq("campaign_id", member.campaign_id)
      .order("created_at", { ascending: false })
      .limit(5),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_events")
        .select(
          "id, title, description, campaign_date, end_date, date_is_approximate, category, status, certainty, source, location_id, npc_id, house_id, faction_id, quest_id, session_id, player_visible",
        )
        .eq("campaign_id", member.campaign_id)
        .order("campaign_date")
        .order("title")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_event_gm_notes")
        .select("event_id, notes")
        .eq("campaign_id", member.campaign_id)
        .order("event_id")
        .range(from, to),
    ),
    supabase
      .from("campaign_event_history")
      .select("id, event_title, action, created_at")
      .eq("campaign_id", member.campaign_id)
      .order("created_at", { ascending: false })
      .limit(12),
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
  ]);

  if (journalError) {
    throw new Error(`Unable to load journal entries: ${journalError.message}`);
  }
  const queryErrors = [
    ["campaign event history", historyError],
  ] as const;
  const failedQuery = queryErrors.find(([, error]) => error);
  if (failedQuery?.[1]) {
    throw new Error(`Unable to load ${failedQuery[0]}: ${failedQuery[1].message}`);
  }

  const monthView = buildCampaignMonthView();
  const latestDatedSession = recentSessions.find((session) => session.campaign_date) ?? null;
  const notesByEventId = new Map(
    eventNotes.map((entry) => [entry.event_id, entry.notes]),
  );
  const sessionsAsOptions = (recentSessions ?? []).map((session) => ({
    id: session.id,
    name: `Session ${session.session_number}`,
  }));
  const eventFormLinks = {
    locations,
    npcs,
    houses,
    factions,
    quests,
    sessions: sessionsAsOptions,
  };
  const chronologicallySortedEvents = [...events].sort((a, b) => {
    const aDate = campaignDateSortValue(a.campaign_date);
    const bDate = campaignDateSortValue(b.campaign_date);
    if (aDate !== null && bDate !== null) return aDate - bDate;
    if (aDate !== null) return -1;
    if (bDate !== null) return 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <>
      <p className="muted">
        Keep the campaign timeline grounded in the in-world date and tie it back to sessions, notes, and major story beats.
      </p>
      <p className="muted">
        <Link href="/gm">Return to overview</Link>
      </p>

      <section className="gm-dashboard" aria-labelledby="calendar-overview-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Calendar</p>
            <h3 id="calendar-overview-heading">In-world tracking</h3>
          </div>
          <span className="header-pill">{CURRENT_IN_WORLD_DATE}</span>
        </div>

        <div className="gm-dashboard-grid" style={{ marginTop: "1rem" }}>
          <article className="gm-dashboard-card">
            <span className="muted">Current date</span>
            <strong>{CURRENT_IN_WORLD_DATE}</strong>
          </article>
          <article className="gm-dashboard-card">
            <span className="muted">Latest dated session</span>
            <strong>{latestDatedSession?.campaign_date ?? "No date recorded"}</strong>
          </article>
          <article className="gm-dashboard-card">
            <span className="muted">Established festivals</span>
            <strong>{CAMPAIGN_FESTIVALS.length}</strong>
          </article>
          <article className="gm-dashboard-card">
            <span className="muted">Week structure</span>
            <strong>{CAMPAIGN_WEEKDAYS.length} days</strong>
          </article>
        </div>
      </section>

      <section className="entry-list" aria-labelledby="calendar-month-heading">
        <div className="section-heading">
          <h3 id="calendar-month-heading">Harvestfall month view</h3>
        </div>
        <article className="entry-card">
          <p className="muted">
            Weekday names are established, but the weekday for 1 Harvestfall has not been anchored. Dates are shown in sequence without assigning weekday columns.
          </p>
          <div className="gm-dashboard-grid" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
            {monthView.map((date) => (
              <div
                key={`${date.month}-${date.day}`}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  minHeight: "4rem",
                  padding: "0.35rem",
                  background: date.day === 1 ? "rgba(141, 90, 43, 0.08)" : "rgba(255,255,255,0.22)",
                }}
              >
                <strong style={{ display: "block", fontSize: "0.8rem" }}>{date.day}</strong>
                {date.day === 1 ? <span className="muted">Current date</span> : null}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="entry-list" aria-labelledby="calendar-festivals-heading">
        <div className="section-heading">
          <h3 id="calendar-festivals-heading">Festival cycle</h3>
        </div>
        <article className="entry-card">
          <ul className="history-list">
            {CAMPAIGN_FESTIVALS.map((festival) => (
              <li key={festival}>
                <strong>{festival}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="entry-list" aria-labelledby="calendar-events-heading">
        <div className="section-heading">
          <div>
            <h3 id="calendar-events-heading">Campaign events</h3>
            <p className="muted">Events are kept separate from canon until explicitly recorded and can be marked approximate, rumored, or unresolved.</p>
          </div>
        </div>
        <CampaignEventForm {...eventFormLinks} />
        {chronologicallySortedEvents.length ? chronologicallySortedEvents.map((event) => (
          <article className="entry-card" key={event.id}>
            <p className="eyebrow">
              {event.player_visible ? "Player-visible" : "GM-only"} · {event.category.replaceAll("_", " ")} · {event.status} · {event.certainty}
            </p>
            <h4>{event.title}</h4>
            <p className="muted">
              <strong>{event.date_is_approximate ? "Approximately " : ""}{event.campaign_date}</strong>
              {event.end_date ? ` – ${event.end_date}` : ""}
            </p>
            {event.description ? <p className="entry-content">{event.description}</p> : null}
            {event.source ? <p className="muted"><strong>Source:</strong> {event.source}</p> : null}
            {notesByEventId.get(event.id) ? (
              <p className="private-notes"><strong>GM-only:</strong> {notesByEventId.get(event.id)}</p>
            ) : null}
            <details className="entry-edit">
              <summary>Edit or delete this event</summary>
              <CampaignEventForm
                {...eventFormLinks}
                event={{
                  ...event,
                  gm_notes: notesByEventId.get(event.id) ?? "",
                } as CampaignEventValue}
              />
            </details>
          </article>
        )) : (
          <p className="muted">No campaign events have been recorded yet.</p>
        )}
      </section>

      <section className="entry-list" aria-labelledby="calendar-journal-heading">
        <div className="section-heading">
          <h3 id="calendar-journal-heading">Recent world notes</h3>
        </div>
        {journalEntries?.length ? (
          journalEntries.map((entry) => (
            <article className="entry-card" key={entry.id}>
              <p className="eyebrow">{entry.campaign_date ?? "Undated entry"}</p>
              <h4>{entry.title}</h4>
            </article>
          ))
        ) : (
          <p className="muted">No journal entries have been dated to the in-world calendar yet.</p>
        )}
      </section>

      <section className="entry-list" aria-labelledby="calendar-history-heading">
        <div className="section-heading">
          <h3 id="calendar-history-heading">Event change history</h3>
        </div>
        {history?.length ? (
          <article className="entry-card">
            <ul className="history-list">
              {history.map((item) => (
                <li key={item.id}>
                  <strong>{item.action}</strong> · {item.event_title} · {new Date(item.created_at).toLocaleString()}
                </li>
              ))}
            </ul>
          </article>
        ) : (
          <p className="muted">Changes to campaign events will be recorded here.</p>
        )}
      </section>
    </>
  );
}
