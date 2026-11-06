import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GmTimelinePage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: sessions, error: sessionsError },
    { data: journalEntries, error: journalError },
    { data: npcs, error: npcError },
    { data: factions, error: factionsError },
  ] = await Promise.all([
    supabase
      .from("campaign_sessions")
      .select("id, session_number, campaign_date, summary, created_at")
      .eq("campaign_id", member.campaign_id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("campaign_journal_entries")
      .select("id, title, campaign_date, created_at, content")
      .eq("campaign_id", member.campaign_id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("campaign_npcs")
      .select("id, name, status, updated_at")
      .eq("campaign_id", member.campaign_id)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("campaign_factions")
      .select("id, name, updated_at")
      .eq("campaign_id", member.campaign_id)
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  if (sessionsError) throw new Error(`Unable to load session timeline: ${sessionsError.message}`);
  if (journalError) throw new Error(`Unable to load journal timeline: ${journalError.message}`);
  if (npcError) throw new Error(`Unable to load NPC timeline: ${npcError.message}`);
  if (factionsError) throw new Error(`Unable to load faction timeline: ${factionsError.message}`);

  const timelineItems = [
    ...((sessions ?? []).map((session) => ({
      id: `session-${session.id}`,
      type: "Session event",
      label: `Session ${session.session_number}`,
      date: session.campaign_date ?? "Undated session",
      summary: session.summary || "No summary recorded yet.",
      timestamp: new Date(session.created_at).getTime(),
    })) ?? []),
    ...((journalEntries ?? []).map((entry) => ({
      id: `journal-${entry.id}`,
      type: "Journal update",
      label: entry.title,
      date: entry.campaign_date ?? "Undated note",
      summary: entry.content || "No detail recorded for this note.",
      timestamp: new Date(entry.created_at).getTime(),
    })) ?? []),
    ...((npcs ?? []).map((npc) => ({
      id: `npc-${npc.id}`,
      type: "NPC update",
      label: npc.name,
      date: npc.status || "Current status",
      summary: `Status: ${npc.status || "Unspecified"}`,
      timestamp: new Date(npc.updated_at).getTime(),
    })) ?? []),
    ...((factions ?? []).map((faction) => ({
      id: `faction-${faction.id}`,
      type: "Faction update",
      label: faction.name,
      date: "Campaign watchlist",
      summary: "Faction remains active in the current campaign ledger.",
      timestamp: new Date(faction.updated_at).getTime(),
    })) ?? []),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
      <p className="muted">
        This chronology keeps the campaign’s major events in one place so the GM can scan activity, session momentum, and faction shifts without jumping between pages.
      </p>
      <p className="muted">
        <Link href="/gm">Return to overview</Link>
      </p>

      <section className="gm-dashboard" aria-labelledby="timeline-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Timeline</p>
            <h3 id="timeline-heading">Campaign chronology</h3>
          </div>
          <span className="header-pill">{timelineItems.length} tracked events</span>
        </div>
      </section>

      <section className="entry-list" aria-labelledby="timeline-events-heading">
        <div className="section-heading">
          <h3 id="timeline-events-heading">Recent activity</h3>
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
          <p className="muted">No campaign activity has been recorded yet.</p>
        )}
      </section>
    </>
  );
}
