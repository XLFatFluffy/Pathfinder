import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";

export const dynamic = "force-dynamic";

export default async function PlayerNpcsPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [npcs, locations] = await Promise.all([
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_npcs")
        .select("id, name, race, occupation, titles, description, status, location_id")
        .eq("campaign_id", member.campaign_id)
        .order("name")
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

  const locationsById = new Map(locations.map((location) => [location.id, location.name]));

  return (
    <>
      <p className="eyebrow">People you know</p>
      <h2>Known characters</h2>
      <p className="muted">
        This directory contains only the people your GM has introduced to the
        party. Hidden NPCs, GM notes, and private status history are not shared.
      </p>
      <p className="muted">
        <Link href="/player">Return to your campaign</Link>
      </p>
      <section className="entry-list" aria-labelledby="npcs-heading">
        <h3 id="npcs-heading">Known NPCs</h3>
        {npcs.length ? (
          npcs.map((npc) => (
            <article className="entry-card" key={npc.id}>
              <p className="eyebrow">
                {[npc.race, npc.occupation, npc.status]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <h4>{npc.name}</h4>
              {npc.titles ? <p className="muted">{npc.titles}</p> : null}
              {npc.description ? (
                <p className="entry-content">{npc.description}</p>
              ) : null}
              {npc.location_id && locationsById.has(npc.location_id) ? (
                <p className="muted">
                  Location: {locationsById.get(npc.location_id)}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="notice">
            Your GM has not marked any NPCs as known to players yet.
          </p>
        )}
      </section>
    </>
  );
}
