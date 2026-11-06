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

export default async function PlayerCalendarPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: campaign, error: campaignError }, { data: recentSessions, error: sessionsError }, { data: journalEntries, error: journalError }] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select("name")
        .eq("id", member.campaign_id)
        .single(),
      supabase
        .from("campaign_sessions")
        .select("id, session_number, campaign_date, summary")
        .eq("campaign_id", member.campaign_id)
        .eq("player_visible", true)
        .order("session_number", { ascending: false })
        .limit(5),
      supabase
        .from("campaign_journal_entries")
        .select("id, title, campaign_date, created_at")
        .eq("campaign_id", member.campaign_id)
        .eq("player_visible", true)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  if (campaignError) {
    throw new Error(`Unable to load the campaign: ${campaignError.message}`);
  }
  if (sessionsError) {
    throw new Error(`Unable to load shared sessions: ${sessionsError.message}`);
  }
  if (journalError) {
    throw new Error(`Unable to load shared journal entries: ${journalError.message}`);
  }

  const monthView = buildCampaignMonthView();
  const nextSession = recentSessions?.find((session) => session.campaign_date) ?? null;

  return (
    <>
      <section className="player-welcome">
        <p className="eyebrow">Campaign timeline</p>
        <h2>{campaign.name}</h2>
        <p className="muted">
          The world keeps a separate in-world calendar. Use it to track what the party knows and when the campaign timeline is shifting.
        </p>
      </section>

      <section className="gm-dashboard" aria-labelledby="player-calendar-overview-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Current date</p>
            <h3 id="player-calendar-overview-heading">World clock</h3>
          </div>
          <span className="header-pill">{CURRENT_IN_WORLD_DATE}</span>
        </div>

        <div className="gm-dashboard-grid" style={{ marginTop: "1rem" }}>
          <article className="gm-dashboard-card">
            <span className="muted">Current in-world date</span>
            <strong>{CURRENT_IN_WORLD_DATE}</strong>
          </article>
          <article className="gm-dashboard-card">
            <span className="muted">Published session</span>
            <strong>{nextSession?.campaign_date ?? "No session date"}</strong>
          </article>
          <article className="gm-dashboard-card">
            <span className="muted">Shared updates</span>
            <strong>{journalEntries?.length ?? 0}</strong>
          </article>
          <article className="gm-dashboard-card">
            <span className="muted">Festival cycle</span>
            <strong>{CAMPAIGN_FESTIVALS.length}</strong>
          </article>
        </div>
      </section>

      <section className="entry-list" aria-labelledby="player-calendar-month-heading">
        <div className="section-heading">
          <h3 id="player-calendar-month-heading">Harvestfall month view</h3>
          <Link href="/player">Return to overview</Link>
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

      <section className="entry-list" aria-labelledby="player-calendar-events-heading">
        <div className="section-heading">
          <h3 id="player-calendar-events-heading">Shared session dates</h3>
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
          <p className="muted">No public campaign dates have been shared yet.</p>
        )}
      </section>

      <section className="entry-list" aria-labelledby="player-calendar-festivals-heading">
        <div className="section-heading">
          <h3 id="player-calendar-festivals-heading">Festival cycle</h3>
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
    </>
  );
}
