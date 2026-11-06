import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllSupabaseRowsOrThrow } from "@/lib/supabase-pagination";
import LocationForm from "./location-form";

export const dynamic = "force-dynamic";

export default async function GmLocationsPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [locations, privateNotes] = await Promise.all([
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_locations")
        .select("id, name, location_type, description, parent_id, player_visible")
        .eq("campaign_id", member.campaign_id)
        .order("name")
        .order("id")
        .range(from, to),
    ),
    getAllSupabaseRowsOrThrow((from, to) =>
      supabase
        .from("campaign_location_gm_notes")
        .select("location_id, notes")
        .eq("campaign_id", member.campaign_id)
        .order("location_id")
        .range(from, to),
    ),
  ]);

  const locationsById = new Map(locations.map((location) => [location.id, location]));
  const notesByLocationId = new Map(
    privateNotes.map((entry) => [entry.location_id, entry.notes]),
  );

  return (
    <>
      <p className="muted">
        Create linked places for the campaign. Player visibility and GM-only notes
        are protected separately by database policies.
      </p>
      <p className="muted">
        <Link href="/gm">Return to overview</Link>
      </p>
      <LocationForm
        parents={locations.map(({ id, name }) => ({ id, name }))}
      />
      <section className="entry-list" aria-labelledby="locations-heading">
        <h3 id="locations-heading">Campaign locations</h3>
        {locations.length ? (
          locations.map((location) => {
            const parent = location.parent_id
              ? locationsById.get(location.parent_id)
              : null;

            return (
              <article className="entry-card" key={location.id}>
                <p className="eyebrow">
                  {location.player_visible ? "Player-visible" : "GM-only"}
                  {location.location_type ? ` · ${location.location_type}` : ""}
                  {parent ? ` · Within ${parent.name}` : ""}
                </p>
                <h4>{location.name}</h4>
                {location.description ? (
                  <p className="entry-content">{location.description}</p>
                ) : null}
                {notesByLocationId.get(location.id) ? (
                  <p className="private-notes">
                    <strong>GM-only:</strong> {notesByLocationId.get(location.id)}
                  </p>
                ) : null}
                <details className="entry-edit">
                  <summary>Edit or delete this location</summary>
                  <LocationForm
                    location={{
                      ...location,
                      gm_notes: notesByLocationId.get(location.id) ?? "",
                    }}
                    parents={locations.map(({ id, name }) => ({ id, name }))}
                  />
                </details>
              </article>
            );
          })
        ) : (
          <p className="muted">No cloud locations yet.</p>
        )}
      </section>
    </>
  );
}
