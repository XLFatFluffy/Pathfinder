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
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("name")
    .eq("id", member.campaign_id)
    .single();

  if (error) {
    throw new Error(`Unable to load the campaign: ${error.message}`);
  }

  const { data: entries, error: entriesError } = await supabase
    .from("campaign_journal_entries")
    .select("id, title, content, campaign_date, player_visible, created_at")
    .eq("campaign_id", member.campaign_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (entriesError) {
    throw new Error(`Unable to load campaign journal entries: ${entriesError.message}`);
  }

  return (
    <>
      <h2>{campaign.name}</h2>
      <p className="muted">
        This account is verified as the GM. Manage campaign journal entries
        here; player visibility is also enforced by database policy.
      </p>
      <p className="notice">
        Existing campaign records remain in the local SQLite app. They have not
        been copied to Supabase.
      </p>
      <p className="muted">
        <Link href="/gm/npcs">Manage campaign NPCs</Link>
      </p>
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
