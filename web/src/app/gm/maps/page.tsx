import Link from "next/link";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCampaignMapArtwork } from "@/lib/campaign-map-artwork";
import MapForm from "./map-form";
import ReplaceArtworkForm from "./replace-artwork-form";

export const dynamic = "force-dynamic";

export default async function GmMapsPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: maps, error }, { data: locations, error: locationsError }] =
    await Promise.all([
      supabase
        .from("campaign_maps")
        .select(
          "id, name, map_type, description, parent_map_id, location_id, player_visible, artwork_path, updated_at",
        )
        .eq("campaign_id", member.campaign_id)
        .order("name"),
      supabase
        .from("campaign_locations")
        .select("id, name")
        .eq("campaign_id", member.campaign_id)
        .order("name"),
    ]);

  if (error) {
    throw new Error(`Unable to load campaign maps: ${error.message}`);
  }
  if (locationsError) {
    throw new Error(`Unable to load linked campaign locations: ${locationsError.message}`);
  }

  const mapsById = new Map(maps.map((map) => [map.id, map]));
  const locationsById = new Map(locations.map((location) => [location.id, location]));
  const mapsWithArtwork = await Promise.all(
    maps.map(async (map) => {
      const artwork = await getCampaignMapArtwork(supabase, map.artwork_path);
      return {
        ...map,
        artworkUrl: artwork.url,
        artworkError: artwork.error,
      };
    }),
  );

  return (
    <>
      <p className="muted">
        Import campaign maps and organize them into levels. Replacing an image
        keeps the map record, hierarchy, and linked location.
      </p>
      <p className="muted">
        <Link href="/gm">Return to overview</Link>
      </p>
      <MapForm
        campaignId={member.campaign_id}
        locations={locations.map(({ id, name }) => ({ id, name }))}
        maps={maps.map(({ id, name }) => ({ id, name }))}
      />
      <section className="entry-list" aria-labelledby="maps-heading">
        <h3 id="maps-heading">Map library</h3>
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
                  {map.player_visible ? "Player-visible" : "GM-only"}
                  {` · ${map.map_type}`}
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
                ) : map.artworkError ? (
                  <p className="error" role="status">
                    Unable to load artwork: {map.artworkError}
                  </p>
                ) : (
                  <p className="muted">No artwork uploaded yet.</p>
                )}
                <ReplaceArtworkForm
                  campaignId={member.campaign_id}
                  mapId={map.id}
                />
              </article>
            );
          })
        ) : (
          <p className="muted">No cloud maps yet.</p>
        )}
      </section>
    </>
  );
}
