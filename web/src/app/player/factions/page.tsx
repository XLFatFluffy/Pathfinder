import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";

export const dynamic = "force-dynamic";

export default async function PlayerFactionsPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [factions, npcs, locations] = await Promise.all([
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_factions")
        .select(
          "id, name, faction_type, description, leader_npc_id, headquarters_location_id",
        )
        .eq("campaign_id", member.campaign_id)
        .order("name")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_npcs")
        .select("id, name")
        .eq("campaign_id", member.campaign_id)
        .order("id")
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

  const npcsById = new Map(npcs.map((npc) => [npc.id, npc.name]));
  const locationsById = new Map(
    locations.map((location) => [location.id, location.name]),
  );

  return (
    <>
      <p className="eyebrow">Organizations and powers</p>
      <h2>Known factions</h2>
      <p className="muted">
        Only factions your GM has introduced are shown. Their hidden objectives,
        resources, membership, activities, history, and secrets remain private.
      </p>
      <p className="muted">
        <Link href="/player">Return to your campaign</Link>
      </p>
      <section className="entry-list" aria-labelledby="factions-heading">
        <h3 id="factions-heading">Factions known to you</h3>
        {factions.length ? (
          factions.map((faction) => (
            <article className="entry-card" key={faction.id}>
              {faction.faction_type ? (
                <p className="eyebrow">{faction.faction_type}</p>
              ) : null}
              <h4>{faction.name}</h4>
              {faction.description ? (
                <p className="entry-content">{faction.description}</p>
              ) : null}
              {faction.leader_npc_id && npcsById.has(faction.leader_npc_id) ? (
                <p className="muted">
                  Leader: {npcsById.get(faction.leader_npc_id)}
                </p>
              ) : null}
              {faction.headquarters_location_id &&
              locationsById.has(faction.headquarters_location_id) ? (
                <p className="muted">
                  Headquarters: {locationsById.get(faction.headquarters_location_id)}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="notice">
            Your GM has not shared any factions yet.
          </p>
        )}
      </section>
    </>
  );
}
