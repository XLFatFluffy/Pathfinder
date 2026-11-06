import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";
import FactionForm from "./faction-form";

export const dynamic = "force-dynamic";

export default async function GmFactionsPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [factions, details, npcs, locations] = await Promise.all([
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_factions")
        .select(
          "id, name, faction_type, description, leader_npc_id, headquarters_location_id, player_visible",
        )
        .eq("campaign_id", member.campaign_id)
        .order("name")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_faction_gm_details")
        .select(
          "faction_id, objectives, resources, influence, membership, allies_and_rivals, current_activities, history, secrets",
        )
        .eq("campaign_id", member.campaign_id)
        .order("faction_id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_npcs")
        .select("id, name")
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
        .order("name")
        .order("id")
        .range(from, to),
    ),
  ]);

  const detailsByFactionId = new Map(
    details.map((detail) => [detail.faction_id, detail]),
  );
  const npcsById = new Map(npcs.map((npc) => [npc.id, npc.name]));
  const locationsById = new Map(
    locations.map((location) => [location.id, location.name]),
  );

  return (
    <>
      <p className="muted">
        Record public faction profiles, connect leaders and headquarters, and
        keep objectives, resources, intelligence, history, and secrets private.
      </p>
      <p className="muted">
        <Link href="/gm">Return to overview</Link>
      </p>
      <FactionForm locations={locations} npcs={npcs} />
      <section className="entry-list" aria-labelledby="factions-heading">
        <h3 id="factions-heading">Campaign factions</h3>
        {factions.length ? (
          factions.map((faction) => {
            const details = detailsByFactionId.get(faction.id);
            return (
              <article className="entry-card" key={faction.id}>
                <p className="eyebrow">
                  {faction.player_visible ? "Known to players" : "GM-only"}
                  {faction.faction_type ? ` · ${faction.faction_type}` : ""}
                  {faction.leader_npc_id && npcsById.has(faction.leader_npc_id)
                    ? ` · Led by ${npcsById.get(faction.leader_npc_id)}`
                    : ""}
                  {faction.headquarters_location_id &&
                  locationsById.has(faction.headquarters_location_id)
                    ? ` · Headquarters: ${locationsById.get(faction.headquarters_location_id)}`
                    : ""}
                </p>
                <h4>{faction.name}</h4>
                {faction.description ? (
                  <p className="entry-content">{faction.description}</p>
                ) : null}
                {details?.objectives ? (
                  <p className="muted">
                    <strong>Objectives:</strong> {details.objectives}
                  </p>
                ) : null}
                {details?.secrets ? (
                  <p className="private-notes">
                    <strong>GM-only:</strong> {details.secrets}
                  </p>
                ) : null}
                <details className="entry-edit">
                  <summary>Edit or delete this faction</summary>
                  <FactionForm
                    faction={{
                      ...faction,
                      objectives: details?.objectives ?? "",
                      resources: details?.resources ?? "",
                      influence: details?.influence ?? "",
                      membership: details?.membership ?? "",
                      allies_and_rivals: details?.allies_and_rivals ?? "",
                      current_activities: details?.current_activities ?? "",
                      history: details?.history ?? "",
                      secrets: details?.secrets ?? "",
                    }}
                    locations={locations}
                    npcs={npcs}
                  />
                </details>
              </article>
            );
          })
        ) : (
          <p className="muted">No campaign factions yet.</p>
        )}
      </section>
    </>
  );
}
