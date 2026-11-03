import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlayerPage() {
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
    .select("id, title, content, campaign_date, created_at")
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
        You are signed in as a campaign player. Only player-visible campaign
        information will be available here.
      </p>
      <section className="entry-list" aria-labelledby="journal-heading">
        <h3 id="journal-heading">Campaign journal</h3>
        {entries.length ? (
          entries.map((entry) => (
            <article className="entry-card" key={entry.id}>
              {entry.campaign_date ? (
                <p className="eyebrow">{entry.campaign_date}</p>
              ) : null}
              <h4>{entry.title}</h4>
              <p className="entry-content">{entry.content}</p>
            </article>
          ))
        ) : (
          <p className="muted">No player-visible journal entries yet.</p>
        )}
      </section>
    </>
  );
}
