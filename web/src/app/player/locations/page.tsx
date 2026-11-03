import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlayerLocationsPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: locations, error } = await supabase
    .from("campaign_locations")
    .select("id, name, location_type, description")
    .eq("campaign_id", member.campaign_id)
    .order("name");

  if (error) {
    throw new Error(`Unable to load player-visible locations: ${error.message}`);
  }

  return (
    <>
      <p className="muted">
        These are the locations the GM has made visible to players.
      </p>
      <p className="muted">
        <Link href="/player">Return to overview</Link>
      </p>
      <section className="entry-list" aria-labelledby="locations-heading">
        <h3 id="locations-heading">Discovered locations</h3>
        {locations.length ? (
          locations.map((location) => (
            <article className="entry-card" key={location.id}>
              {location.location_type ? (
                <p className="eyebrow">{location.location_type}</p>
              ) : null}
              <h4>{location.name}</h4>
              {location.description ? (
                <p className="entry-content">{location.description}</p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="muted">The GM has not shared any locations yet.</p>
        )}
      </section>
    </>
  );
}
