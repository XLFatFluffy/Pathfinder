import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import JournalEntryForm from "./journal-entry-form";

export const dynamic = "force-dynamic";

const JOURNAL_PAGE_SIZE = 50;

export default async function GmPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page: pageParam } = await searchParams;
  const parsedPage = typeof pageParam === "string" ? Number(pageParam) : 1;
  const requestedPage =
    Number.isSafeInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: campaign, error },
    { count: journalEntryCount, error: journalCountError },
    locationsResult,
    npcsResult,
    housesResult,
    factionsResult,
    questsResult,
    sessionsResult,
    charactersResult,
    activeQuestsResult,
    { data: latestSessions, error: latestSessionsError },
    { data: notableNpcs, error: notableNpcError },
    { data: notableFactions, error: notableFactionError },
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select("name")
      .eq("id", member.campaign_id)
      .single(),
    supabase
      .from("campaign_journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", member.campaign_id),
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
    supabase
      .from("campaign_npcs")
      .select("id, name, status, occupation")
      .eq("campaign_id", member.campaign_id)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(3),
    supabase
      .from("campaign_factions")
      .select("id, name, faction_type")
      .eq("campaign_id", member.campaign_id)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(3),
  ]);

  if (error) {
    throw new Error(`Unable to load the campaign: ${error.message}`);
  }
  if (journalCountError) {
    throw new Error(
      `Unable to count campaign journal entries: ${journalCountError.message}`,
    );
  }
  if (latestSessionsError) {
    throw new Error(`Unable to load recent sessions: ${latestSessionsError.message}`);
  }
  if (notableNpcError) {
    throw new Error(`Unable to load notable NPCs: ${notableNpcError.message}`);
  }
  if (notableFactionError) {
    throw new Error(`Unable to load notable factions: ${notableFactionError.message}`);
  }
  const latestDatedSession =
    latestSessions.find((session) => session.campaign_date) ?? null;
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
  const pageCount = Math.max(
    1,
    Math.ceil((journalEntryCount ?? 0) / JOURNAL_PAGE_SIZE),
  );
  if (requestedPage > pageCount) {
    redirect(pageCount === 1 ? "/gm" : `/gm?page=${pageCount}`);
  }
  const journalStart = (requestedPage - 1) * JOURNAL_PAGE_SIZE;
  const { data: entries, error: entriesError } = await supabase
    .from("campaign_journal_entries")
    .select("id, title, content, campaign_date, player_visible, created_at")
    .eq("campaign_id", member.campaign_id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(journalStart, journalStart + JOURNAL_PAGE_SIZE - 1);
  if (entriesError) {
    throw new Error(
      `Unable to load campaign journal entries: ${entriesError.message}`,
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

  const quickActions = [
    { label: "Create quest", href: "/gm/quests" },
    { label: "Plan encounter", href: "/gm/encounters" },
    { label: "Create note", href: "/gm/notes" },
    { label: "Add NPC", href: "/gm/npcs" },
    { label: "Add location", href: "/gm/locations" },
    { label: "Manage sessions", href: "/gm/sessions" },
    { label: "Review living world", href: "/gm/world" },
    { label: "Record campaign event", href: "/gm/calendar" },
    { label: "Review atlas", href: "/gm/atlas" },
  ];

  return (
    <>
      <h2>{campaign.name}</h2>
      <p className="muted">
        This account is verified as the GM. Use the campaign control room to
        track the world state, session momentum, and active story threads.
      </p>
      <div className="gm-dashboard" aria-labelledby="campaign-state-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Campaign overview</p>
            <h3 id="campaign-state-heading">Current world state</h3>
          </div>
          <span className="header-pill">Today: 1 Harvestfall, 243 AC</span>
        </div>
        <div className="gm-dashboard-grid" style={{ marginTop: "1rem" }}>
          <article className="gm-dashboard-card">
            <span className="muted">Current in-world date</span>
            <strong>1 Harvestfall, 243 AC</strong>
          </article>
          <article className="gm-dashboard-card">
            <span className="muted">Latest session</span>
            <strong>
              {latestDatedSession?.campaign_date ?? "No date recorded"}
            </strong>
          </article>
          <article className="gm-dashboard-card">
            <span className="muted">Active quests</span>
            <strong>{activeQuestsResult.count ?? 0}</strong>
          </article>
          <article className="gm-dashboard-card">
            <span className="muted">Latest update</span>
            <strong>{latestSessions[0]?.campaign_date ?? "No updates yet"}</strong>
          </article>
        </div>
      </div>

      <section className="entry-list" aria-labelledby="quick-actions-heading">
        <div className="section-heading">
          <h3 id="quick-actions-heading">Quick actions</h3>
        </div>
        <div className="gm-dashboard-grid">
          {quickActions.map(({ label, href }) => (
            <Link key={label} href={href} className="button-link" style={{ width: "100%" }}>
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="gm-dashboard" aria-labelledby="campaign-state-heading-2">
        <div className="section-heading">
          <h3 id="campaign-state-heading-2">Campaign state</h3>
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

      <section className="entry-list" aria-labelledby="signals-heading">
        <div className="section-heading">
          <h3 id="signals-heading">Notable signals</h3>
        </div>
        <div className="gm-dashboard-grid">
          <article className="entry-card">
            <p className="eyebrow">Important NPCs</p>
            {notableNpcs.length ? (
              <ul className="history-list">
                {notableNpcs.map((npc) => (
                  <li key={npc.id}>
                    <strong>{npc.name}</strong>
                    {npc.status ? ` · ${npc.status}` : ""}
                    {npc.occupation ? ` · ${npc.occupation}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No NPCs recorded yet.</p>
            )}
          </article>
          <article className="entry-card">
            <p className="eyebrow">Factions to watch</p>
            {notableFactions.length ? (
              <ul className="history-list">
                {notableFactions.map((faction) => (
                  <li key={faction.id}>
                    <strong>{faction.name}</strong>
                    {faction.faction_type ? ` · ${faction.faction_type}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No factions recorded yet.</p>
            )}
          </article>
        </div>
      </section>
      <JournalEntryForm />
      <section className="entry-list" aria-labelledby="journal-heading">
        <div className="section-heading">
          <div>
            <h3 id="journal-heading">Campaign journal</h3>
            <p className="muted">{journalEntryCount ?? 0} entries</p>
          </div>
          {journalEntryCount ? (
            <span className="muted">
              Showing {journalStart + 1}-{journalStart + entries.length} of{" "}
              {journalEntryCount}
            </span>
          ) : null}
        </div>
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
        {pageCount > 1 ? (
          <nav className="journal-pagination" aria-label="Campaign journal pages">
            {requestedPage > 1 ? (
              <Link
                href={requestedPage === 2 ? "/gm" : `/gm?page=${requestedPage - 1}`}
              >
                Newer entries
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            <span className="muted">
              Page {requestedPage} of {pageCount}
            </span>
            {requestedPage < pageCount ? (
              <Link href={`/gm?page=${requestedPage + 1}`}>Older entries</Link>
            ) : (
              <span aria-hidden="true" />
            )}
          </nav>
        ) : null}
      </section>
    </>
  );
}
