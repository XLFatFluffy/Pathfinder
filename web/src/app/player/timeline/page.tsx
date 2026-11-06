import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlayerTimelinePage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: campaign, error: campaignError },
    { data: sessions, error: sessionsError },
    { data: journalEntries, error: journalError },
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select("name")
      .eq("id", member.campaign_id)
      .single(),
    supabase
      .from("campaign_sessions")
      .select("id, session_number, campaign_date, summary, created_at")
      .eq("campaign_id", member.campaign_id)
      .eq("player_visible", true)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("campaign_journal_entries")
      .select("id, title, campaign_date, created_at, content")
      .eq("campaign_id", member.campaign_id)
      .eq("player_visible", true)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (campaignError) throw new Error(`Unable to load the campaign: ${campaignError.message}`);
  if (sessionsError) throw new Error(`Unable to load shared sessions: ${sessionsError.message}`);
  if (journalError) throw new Error(`Unable to load shared journal entries: ${journalError.message}`);

  const timelineItems = [
    ...((sessions ?? []).map((session) => ({
      id: `session-${session.id}`,
      type: "Session",
      label: `Session ${session.session_number}`,
      date: session.campaign_date ?? "Undated session",
      summary: session.summary || "No summary recorded yet.",
      timestamp: new Date(session.created_at).getTime(),
    })) ?? []),
    ...((journalEntries ?? []).map((entry) => ({
      id: `journal-${entry.id}`,
      type: "Journal",
      label: entry.title,
      date: entry.campaign_date ?? "Undated note",
      summary: entry.content || "No note content recorded.",
      timestamp: new Date(entry.created_at).getTime(),
    })) ?? []),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
      <section className="player-welcome">
        <p className="eyebrow">Campaign timeline</p>
        <h2>{campaign.name}</h2>
        <p className="muted">
          Follow the public record of sessions, revelations, and notable developments in the order they happened.
        </p>
      </section>

      <section className="gm-dashboard" aria-labelledby="player-timeline-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Timeline</p>
            <h3 id="player-timeline-heading">Player-facing chronology</h3>
          </div>
          <span className="header-pill">{timelineItems.length} public entries</span>
        </div>
      </section>

      <section className="entry-list" aria-labelledby="player-timeline-events-heading">
        <div className="section-heading">
          <h3 id="player-timeline-events-heading">Recent public activity</h3>
          <Link href="/player">Return to overview</Link>
        </div>
        {timelineItems.length ? (
          timelineItems.map((item) => (
            <article className="entry-card" key={item.id}>
              <p className="eyebrow">{item.type}</p>
              <h4>{item.label}</h4>
              <p className="muted">
                <strong>{item.date}</strong>
              </p>
              <p className="entry-content">{item.summary}</p>
            </article>
          ))
        ) : (
          <p className="muted">No shared timeline entries are available yet.</p>
        )}
      </section>
    </>
  );
}
