import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlayerMapsPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: maps, error }, { data: locations, error: locationsError }] =
    await Promise.all([
      supabase
        .from("campaign_maps")
        .select("id, name, map_type, description, parent_map_id, location_id, artwork_path")
        .eq("campaign_id", member.campaign_id)
        .order("name"),
      supabase
        .from("campaign_locations")
        .select("id, name")
        .eq("campaign_id", member.campaign_id),
    ]);

  if (error) {
    throw new Error(`Unable to load player-visible maps: ${error.message}`);
  }
  if (locationsError) {
    throw new Error(`Unable to load player-visible locations: ${locationsError.message}`);
  }

  const mapsById = new Map(maps.map((map) => [map.id, map]));
  const locationsById = new Map(locations.map((location) => [location.id, location]));
  const mapsWithArtwork = await Promise.all(
    maps.map(async (map) => {
      if (!map.artwork_path) {
        return { ...map, artworkUrl: null };
      }

      const { data, error: artworkError } = await supabase.storage
        .from("campaign-maps")
        .createSignedUrl(map.artwork_path, 60);
      if (artworkError) {
        throw new Error(
          `Unable to create a temporary view link for "${map.name}": ${artworkError.message}`,
        );
      }

      return { ...map, artworkUrl: data.signedUrl };
    }),
  );

  return (
    <>
      <p className="muted">
        These are the maps the GM has shared with campaign players.
      </p>
      <p className="muted">
        <Link href="/player">Return to overview</Link>
      </p>
      <section className="entry-list" aria-labelledby="maps-heading">
        <h3 id="maps-heading">Shared maps</h3>
        {mapsWithArtwork.length ? (
          mapsWithArtwork.map((map) => {
            const parent = map.parent_map_id
              ? mapsById.get(map.parent_map_id)
              : null;
            const location = map.location_id
              ? locationsById.get(map.location_id)
              : null;

            return (
              <article className="entry-card map-card" key={map.id}>
                <p className="eyebrow">
                  {map.map_type}
                  {parent ? ` · Within ${parent.name}` : ""}
                  {location ? ` · ${location.name}` : ""}
                </p>
                <h4>{map.name}</h4>
                {map.description ? (
                  <p className="entry-content">{map.description}</p>
                ) : null}
                {map.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`Artwork for ${map.name}`}
                    className="map-preview"
                    src={map.artworkUrl}
                  />
                ) : (
                  <p className="muted">Map artwork is not available yet.</p>
                )}
              </article>
            );
          })
        ) : (
          <p className="muted">The GM has not shared any maps yet.</p>
        )}
      </section>
    </>
  );
}
