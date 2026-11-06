import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";

export const dynamic = "force-dynamic";

export default async function PlayerQuestsPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [quests, locations] = await Promise.all([
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_quests")
        .select("id, name, status, summary, giver, location_id")
        .eq("campaign_id", member.campaign_id)
        .order("updated_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_locations")
        .select("id, name")
        .eq("campaign_id", member.campaign_id)
        .order("id")
        .range(from, to),
    ),
  ]);

  const locationsById = new Map(
    locations.map((location) => [location.id, location.name]),
  );

  return (
    <>
      <p className="eyebrow">Adventure threads</p>
      <h2>Campaign quests</h2>
      <p className="muted">
        Follow the story threads your GM has shared with the party. Hidden
        quests and GM-only notes are not included.
      </p>
      <p className="muted">
        <Link href="/player">Return to your campaign</Link>
      </p>
      <section className="entry-list" aria-labelledby="quests-heading">
        <h3 id="quests-heading">Shared quests</h3>
        {quests.length ? (
          quests.map((quest) => (
            <article className="entry-card" key={quest.id}>
              <p className="eyebrow">{quest.status}</p>
              <h4>{quest.name}</h4>
              {quest.giver ? (
                <p className="muted">
                  <strong>Quest giver:</strong> {quest.giver}
                </p>
              ) : null}
              {quest.location_id && locationsById.has(quest.location_id) ? (
                <p className="muted">
                  <strong>Location:</strong> {locationsById.get(quest.location_id)}
                </p>
              ) : null}
              {quest.summary ? (
                <p className="entry-content">{quest.summary}</p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="notice">
            Your GM has not shared any quests yet.
          </p>
        )}
      </section>
    </>
  );
}
