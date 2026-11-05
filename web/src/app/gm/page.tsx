import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import JournalEntryForm from "./journal-entry-form";

export const dynamic = "force-dynamic";

export default async function GmPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: campaign, error },
    { data: entries, error: entriesError },
    locationsResult,
    npcsResult,
    housesResult,
    factionsResult,
    questsResult,
    sessionsResult,
    charactersResult,
    activeQuestsResult,
    { data: latestSessions, error: latestSessionsError },
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select("name")
      .eq("id", member.campaign_id)
      .single(),
    supabase
      .from("campaign_journal_entries")
      .select("id, title, content, campaign_date, player_visible, created_at")
      .eq("campaign_id", member.campaign_id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("campaign_locations")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", member.campaign_id),
    supabase
      .from("campaign_npcs")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", member.campaign_id),
    supabase
      .from("campaign_houses")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", member.campaign_id),
    supabase
      .from("campaign_factions")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", member.campaign_id),
    supabase
      .from("campaign_quests")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", member.campaign_id),
    supabase
      .from("campaign_sessions")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", member.campaign_id),
    supabase
      .from("campaign_characters")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", member.campaign_id),
    supabase
      .from("campaign_quests")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", member.campaign_id)
      .eq("status", "active"),
    supabase
      .from("campaign_sessions")
      .select("id, session_number, campaign_date, summary")
      .eq("campaign_id", member.campaign_id)
      .order("session_number", { ascending: false })
      .limit(3),
  ]);

  if (error) {
    throw new Error(`Unable to load the campaign: ${error.message}`);
  }
  if (entriesError) {
    throw new Error(`Unable to load campaign journal entries: ${entriesError.message}`);
  }
  if (latestSessionsError) {
    throw new Error(`Unable to load recent sessions: ${latestSessionsError.message}`);
  }
  const countResults = [
    ["locations", locationsResult],
    ["NPCs", npcsResult],
    ["houses", housesResult],
    ["factions", factionsResult],
    ["quests", questsResult],
    ["sessions", sessionsResult],
    ["characters", charactersResult],
    ["active quests", activeQuestsResult],
  ] as const;
  const failedCount = countResults.find(([, result]) => result.error);
  if (failedCount?.[1].error) {
    throw new Error(
      `Unable to load campaign ${failedCount[0]} count: ${failedCount[1].error.message}`,
    );
  }
  const counts = [
    ["Locations", locationsResult.count],
    ["NPCs", npcsResult.count],
    ["Houses", housesResult.count],
    ["Factions", factionsResult.count],
    ["Quests", questsResult.count],
    ["Sessions", sessionsResult.count],
    ["Characters", charactersResult.count],
  ] as const;

  return (
    <>
      <h2>{campaign.name}</h2>
      <p className="muted">
        This account is verified as the GM. Manage campaign journal entries
        here; player visibility is also enforced by database policy.
      </p>
      <p className="muted">
        <Link href="/gm/npcs">Manage campaign NPCs</Link>
        {" · "}
        <Link href="/gm/factions">Manage campaign factions</Link>
        {" · "}
        <Link href="/gm/quests">Manage campaign quests</Link>
        {" · "}
        <Link href="/gm/sessions">Manage session logs</Link>
        {" · "}
        <Link href="/gm/characters">Review player characters</Link>
        {" · "}
        <Link href="/gm/import">AI campaign-data import</Link>
      </p>
      <section className="gm-dashboard" aria-labelledby="campaign-state-heading">
        <div className="section-heading">
          <h3 id="campaign-state-heading">Campaign state</h3>
          <p className="muted">
            {activeQuestsResult.count ?? 0} active quests
          </p>
        </div>
        <div className="gm-dashboard-grid">
          {counts.map(([label, count]) => (
            <article className="gm-dashboard-card" key={label}>
              <span className="muted">{label}</span>
              <strong>{count ?? 0}</strong>
            </article>
          ))}
        </div>
        <div className="entry-list">
          <h4>Recent sessions</h4>
          {latestSessions.length ? (
            latestSessions.map((session) => (
              <article className="entry-card" key={session.id}>
                <p className="eyebrow">
                  Session {session.session_number}
                  {session.campaign_date ? ` · ${session.campaign_date}` : ""}
                </p>
                <p className="entry-content">
                  {session.summary || "No session summary yet."}
                </p>
              </article>
            ))
          ) : (
            <p className="muted">No cloud session logs have been added.</p>
          )}
        </div>
      </section>
      <JournalEntryForm />
      <section className="entry-list" aria-labelledby="journal-heading">
        <h3 id="journal-heading">Campaign journal</h3>
        {entries.length ? (
          entries.map((entry) => (
            <article className="entry-card" key={entry.id}>
              <p className="eyebrow">
                {entry.player_visible ? "Player-visible" : "GM-only"}
                {entry.campaign_date ? ` · ${entry.campaign_date}` : ""}
              </p>
              <h4>{entry.title}</h4>
              <p className="entry-content">{entry.content}</p>
              <details className="entry-edit">
                <summary>Edit or delete this entry</summary>
                <JournalEntryForm entry={entry} />
              </details>
            </article>
          ))
        ) : (
          <p className="muted">No cloud journal entries yet.</p>
        )}
      </section>
    </>
  );
}
