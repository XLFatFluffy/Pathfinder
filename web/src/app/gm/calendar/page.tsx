import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  CAMPAIGN_FESTIVALS,
  CAMPAIGN_WEEKDAYS,
  CURRENT_IN_WORLD_DATE,
  buildCampaignMonthView,
} from "@/lib/campaign-calendar";

export const dynamic = "force-dynamic";

export default async function GmCalendarPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: recentSessions, error: sessionsError }, { data: journalEntries, error: journalError }] =
    await Promise.all([
      supabase
        .from("campaign_sessions")
        .select("id, session_number, campaign_date, summary")
        .eq("campaign_id", member.campaign_id)
        .order("session_number", { ascending: false })
        .limit(5),
      supabase
        .from("campaign_journal_entries")
        .select("id, title, campaign_date, created_at")
        .eq("campaign_id", member.campaign_id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  if (sessionsError) {
    throw new Error(`Unable to load campaign sessions: ${sessionsError.message}`);
  }
  if (journalError) {
    throw new Error(`Unable to load journal entries: ${journalError.message}`);
  }

  const monthView = buildCampaignMonthView();
  const nextSession = recentSessions?.find((session) => session.campaign_date) ?? null;
  const upcomingNotes = [
    "Calendar management remains intentionally lightweight: use it as a GM planning board and session tracker, not a replacement for detailed narrative records.",
    "Use the campaign date field on sessions and journal entries to maintain in-world chronology without forcing a full historical database.",
  ];

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
            <span className="muted">Next session</span>
            <strong>{nextSession?.campaign_date ?? "No date recorded"}</strong>
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
          <div className="gm-dashboard-grid" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
            {CAMPAIGN_WEEKDAYS.map((day) => (
              <div key={day} className="muted" style={{ textAlign: "center", fontWeight: 700 }}>
                {day}
              </div>
            ))}
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
          <h3 id="calendar-events-heading">Upcoming and recent session dates</h3>
        </div>
        {recentSessions?.length ? (
          recentSessions.map((session) => (
            <article className="entry-card" key={session.id}>
              <p className="eyebrow">Session {session.session_number}</p>
              <h4>{session.campaign_date ?? "Undated session"}</h4>
              <p className="entry-content">{session.summary || "No summary recorded."}</p>
            </article>
          ))
        ) : (
          <p className="muted">No campaign dates have been recorded yet.</p>
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

      <section className="entry-list" aria-labelledby="calendar-guidance-heading">
        <div className="section-heading">
          <h3 id="calendar-guidance-heading">GM notes</h3>
        </div>
        <article className="entry-card">
          <ul className="history-list">
            {upcomingNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}
