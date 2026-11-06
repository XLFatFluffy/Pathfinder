import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";
import HouseForm from "./house-form";
import HouseRelationshipForm from "./relationship-form";
import { formatHouseRelationshipType } from "./relationship-types";

export const dynamic = "force-dynamic";

export default async function GmHousesPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [
    houses,
    details,
    npcs,
    locations,
    relationships,
    relationshipNotes,
    relationshipHistory,
  ] = await Promise.all([
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_houses")
        .select("id, name, heraldry_description, motto, description, player_visible")
        .eq("campaign_id", member.campaign_id)
        .order("name")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_house_gm_details")
        .select(
          "house_id, founding_history, current_ruler_id, ancestral_seat_location_id, holdings, succession, military_strength, wealth, resources, political_influence, religious_affiliations, objectives, secrets",
        )
        .eq("campaign_id", member.campaign_id)
        .order("house_id")
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
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_house_relationships")
        .select(
          "id, house_id, related_house_id, relationship_type, description, player_visible",
        )
        .eq("campaign_id", member.campaign_id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_house_relationship_gm_notes")
        .select("relationship_id, notes")
        .eq("campaign_id", member.campaign_id)
        .order("relationship_id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_house_relationship_history")
        .select(
          "id, relationship_id, previous_type, new_type, campaign_date, reason, created_at",
        )
        .eq("campaign_id", member.campaign_id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to),
    ),
  ]);

  const detailsByHouseId = new Map(details.map((detail) => [detail.house_id, detail]));
  const npcsById = new Map(npcs.map((npc) => [npc.id, npc.name]));
  const locationsById = new Map(locations.map((location) => [location.id, location.name]));
  const houseNamesById = new Map(houses.map((house) => [house.id, house.name]));
  const notesByRelationshipId = new Map(
    relationshipNotes.map((entry) => [entry.relationship_id, entry.notes]),
  );
  const historyByRelationshipId = new Map<string, typeof relationshipHistory>();
  for (const entry of relationshipHistory) {
    const history = historyByRelationshipId.get(entry.relationship_id) ?? [];
    history.push(entry);
    historyByRelationshipId.set(entry.relationship_id, history);
  }

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
      <section className="entry-list" aria-labelledby="relationships-heading">
        <h3 id="relationships-heading">House relationships</h3>
        <HouseRelationshipForm houses={houses.map(({ id, name }) => ({ id, name }))} />
        {relationships.length ? (
          relationships.map((relationship) => {
            const history = historyByRelationshipId.get(relationship.id) ?? [];
            return (
              <article className="entry-card" key={relationship.id}>
                <p className="eyebrow">
                  {relationship.player_visible ? "Shared with players" : "GM-only"}
                  {` · ${formatHouseRelationshipType(relationship.relationship_type)}`}
                </p>
                <h4>
                  {houseNamesById.get(relationship.house_id) ?? "Unknown house"}
                  {" → "}
                  {houseNamesById.get(relationship.related_house_id) ?? "Unknown house"}
                </h4>
                {relationship.description ? (
                  <p className="entry-content">{relationship.description}</p>
                ) : null}
                {notesByRelationshipId.get(relationship.id) ? (
                  <p className="private-notes">
                    <strong>GM-only:</strong>{" "}
                    {notesByRelationshipId.get(relationship.id)}
                  </p>
                ) : null}
                <details className="entry-edit">
                  <summary>Edit or delete this relationship</summary>
                  <HouseRelationshipForm
                    houses={houses.map(({ id, name }) => ({ id, name }))}
                    relationship={{
                      ...relationship,
                      gm_notes: notesByRelationshipId.get(relationship.id) ?? "",
                    }}
                  />
                </details>
                <details className="entry-edit">
                  <summary>History ({history.length})</summary>
                  {history.length ? (
                    <ul className="history-list">
                      {history.map((entry) => (
                        <li key={entry.id}>
                          {entry.previous_type
                            ? `${formatHouseRelationshipType(entry.previous_type)} → `
                            : "Established as "}
                          <strong>
                            {formatHouseRelationshipType(entry.new_type)}
                          </strong>
                          {entry.campaign_date ? ` · ${entry.campaign_date}` : ""}
                          {entry.reason ? ` — ${entry.reason}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No relationship history recorded.</p>
                  )}
                </details>
              </article>
            );
          })
        ) : (
          <p className="muted">No house relationships recorded yet.</p>
        )}
      </section>
    </>
  );
}
