import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import HouseForm from "./house-form";

export const dynamic = "force-dynamic";

export default async function GmHousesPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: houses, error },
    { data: details, error: detailsError },
    { data: npcs, error: npcsError },
    { data: locations, error: locationsError },
  ] = await Promise.all([
    supabase
      .from("campaign_houses")
      .select("id, name, heraldry_description, motto, description, player_visible")
      .eq("campaign_id", member.campaign_id)
      .order("name"),
    supabase
      .from("campaign_house_gm_details")
      .select(
        "house_id, founding_history, current_ruler_id, ancestral_seat_location_id, holdings, succession, military_strength, wealth, resources, political_influence, religious_affiliations, objectives, secrets",
      )
      .eq("campaign_id", member.campaign_id),
    supabase
      .from("campaign_npcs")
      .select("id, name")
      .eq("campaign_id", member.campaign_id)
      .order("name"),
    supabase
      .from("campaign_locations")
      .select("id, name")
      .eq("campaign_id", member.campaign_id)
      .order("name"),
  ]);

  if (error) {
    throw new Error(`Unable to load noble houses: ${error.message}`);
  }
  if (detailsError) {
    throw new Error(`Unable to load private noble-house details: ${detailsError.message}`);
  }
  if (npcsError) {
    throw new Error(`Unable to load house rulers: ${npcsError.message}`);
  }
  if (locationsError) {
    throw new Error(`Unable to load ancestral seats: ${locationsError.message}`);
  }

  const detailsByHouseId = new Map(details.map((detail) => [detail.house_id, detail]));
  const npcsById = new Map(npcs.map((npc) => [npc.id, npc.name]));
  const locationsById = new Map(locations.map((location) => [location.id, location.name]));

  return (
    <>
      <p className="muted">
        Record each house once and connect it to the NPC who rules it and its
        ancestral seat. Public profile details are separate from political
        information and secrets reserved for the GM.
      </p>
      <p className="muted">
        <Link href="/gm">Return to overview</Link>
      </p>
      <HouseForm locations={locations} npcs={npcs} />
      <section className="entry-list" aria-labelledby="houses-heading">
        <h3 id="houses-heading">Noble houses</h3>
        {houses.length ? (
          houses.map((house) => {
            const details = detailsByHouseId.get(house.id);
            return (
              <article className="entry-card" key={house.id}>
                <p className="eyebrow">
                  {house.player_visible ? "Known to players" : "GM-only"}
                  {details?.current_ruler_id && npcsById.has(details.current_ruler_id)
                    ? ` · Ruled by ${npcsById.get(details.current_ruler_id)}`
                    : ""}
                  {details?.ancestral_seat_location_id &&
                  locationsById.has(details.ancestral_seat_location_id)
                    ? ` · Seat: ${locationsById.get(details.ancestral_seat_location_id)}`
                    : ""}
                </p>
                <h4>{house.name}</h4>
                {house.heraldry_description ? (
                  <p className="muted">{house.heraldry_description}</p>
                ) : null}
                {house.motto ? <p className="entry-content">“{house.motto}”</p> : null}
                {house.description ? (
                  <p className="entry-content">{house.description}</p>
                ) : null}
                {details?.founding_history ? (
                  <p className="muted">
                    <strong>Founding:</strong> {details.founding_history}
                  </p>
                ) : null}
                {details?.holdings ? (
                  <p className="muted">
                    <strong>Holdings:</strong> {details.holdings}
                  </p>
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
                  <summary>Edit or delete this house</summary>
                  <HouseForm
                    house={{
                      ...house,
                      founding_history: details?.founding_history ?? "",
                      current_ruler_id: details?.current_ruler_id ?? null,
                      ancestral_seat_location_id:
                        details?.ancestral_seat_location_id ?? null,
                      holdings: details?.holdings ?? "",
                      succession: details?.succession ?? "",
                      military_strength: details?.military_strength ?? "",
                      wealth: details?.wealth ?? "",
                      resources: details?.resources ?? "",
                      political_influence: details?.political_influence ?? "",
                      religious_affiliations: details?.religious_affiliations ?? "",
                      objectives: details?.objectives ?? "",
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
          <p className="muted">No noble houses yet.</p>
        )}
      </section>
    </>
  );
}
