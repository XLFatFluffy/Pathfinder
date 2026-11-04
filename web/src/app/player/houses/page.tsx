import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlayerHousesPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: houses, error } = await supabase
    .from("campaign_houses")
    .select("id, name, heraldry_description, motto, description")
    .eq("campaign_id", member.campaign_id)
    .order("name");

  if (error) {
    throw new Error(`Unable to load known noble houses: ${error.message}`);
  }

  return (
    <>
      <p className="eyebrow">People and politics</p>
      <h2>Known noble houses</h2>
      <p className="muted">
        Only houses your GM has introduced are shown. Private political details,
        rulers not yet known to the party, and house secrets stay hidden.
      </p>
      <p className="muted">
        <Link href="/player">Return to your campaign</Link>
      </p>
      <section className="entry-list" aria-labelledby="houses-heading">
        <h3 id="houses-heading">Houses known to you</h3>
        {houses.length ? (
          houses.map((house) => (
            <article className="entry-card" key={house.id}>
              {house.heraldry_description ? (
                <p className="eyebrow">{house.heraldry_description}</p>
              ) : null}
              <h4>{house.name}</h4>
              {house.motto ? (
                <p className="entry-content">
                  <em>“{house.motto}”</em>
                </p>
              ) : null}
              {house.description ? (
                <p className="entry-content">{house.description}</p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="notice">
            Your GM has not shared any noble houses yet.
          </p>
        )}
      </section>
    </>
  );
}
