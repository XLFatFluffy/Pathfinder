import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlayerPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: campaign, error: campaignError },
    { count: journalCount, error: journalCountError },
    { count: locationCount, error: locationCountError },
    { count: mapCount, error: mapCountError },
    { count: npcCount, error: npcCountError },
    { count: houseCount, error: houseCountError },
    { data: entries, error: entriesError },
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
      .from("campaign_maps")
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
      .from("campaign_journal_entries")
      .select("id, title, content, campaign_date, created_at")
      .eq("campaign_id", member.campaign_id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (campaignError) {
    throw new Error(`Unable to load the campaign: ${campaignError.message}`);
  }
  if (journalCountError) {
    throw new Error(`Unable to count shared journal entries: ${journalCountError.message}`);
  }
  if (locationCountError) {
    throw new Error(`Unable to count shared locations: ${locationCountError.message}`);
  }
  if (mapCountError) {
    throw new Error(`Unable to count shared maps: ${mapCountError.message}`);
  }
  if (npcCountError) {
    throw new Error(`Unable to count known NPCs: ${npcCountError.message}`);
  }
  if (houseCountError) {
    throw new Error(`Unable to count known noble houses: ${houseCountError.message}`);
  }
  if (entriesError) {
    throw new Error(`Unable to load campaign journal entries: ${entriesError.message}`);
  }

  return (
    <>
      <section className="player-welcome">
        <p className="eyebrow">Your campaign</p>
        <h2>{campaign.name}</h2>
        <p className="muted">
          Welcome to your campaign space. Explore shared places and maps, and
          catch up on the latest journal entries from your GM.
        </p>
      </section>
      <section className="player-resource-grid" aria-label="Shared campaign resources">
        <Link className="player-resource-card" href="/player/locations">
          <span className="eyebrow">Discover</span>
          <strong>Locations</strong>
          <span className="muted">{locationCount ?? 0} shared places</span>
        </Link>
        <Link className="player-resource-card" href="/player/npcs">
          <span className="eyebrow">People</span>
          <strong>Known characters</strong>
          <span className="muted">{npcCount ?? 0} introduced NPCs</span>
        </Link>
        <Link className="player-resource-card" href="/player/houses">
          <span className="eyebrow">Politics</span>
          <strong>Noble houses</strong>
          <span className="muted">{houseCount ?? 0} known houses</span>
        </Link>
        <Link className="player-resource-card" href="/player/atlas">
          <span className="eyebrow">Explore</span>
          <strong>World atlas</strong>
          <span className="muted">Browse maps and markers</span>
        </Link>
        <Link className="player-resource-card" href="/player/maps">
          <span className="eyebrow">Reference</span>
          <strong>Map library</strong>
          <span className="muted">{mapCount ?? 0} shared maps</span>
        </Link>
        <Link className="player-resource-card" href="/player/notes">
          <span className="eyebrow">Personal</span>
          <strong>My notes</strong>
          <span className="muted">Private clues and reminders</span>
        </Link>
      </section>
      <section className="entry-list" aria-labelledby="journal-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Stay up to date</p>
            <h3 id="journal-heading">Campaign journal</h3>
          </div>
          <span className="muted">{journalCount ?? 0} shared entries</span>
        </div>
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
          <p className="notice">
            No journal entries have been shared yet. When your GM posts updates,
            they will appear here.
          </p>
        )}
      </section>
    </>
  );
}
