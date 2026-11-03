import Link from "next/link";
import MapAtlas from "@/app/atlas/map-atlas";
import { getCampaignAtlasData } from "@/lib/campaign-atlas";
import { getCurrentCampaignMember } from "@/lib/campaign-member";

export const dynamic = "force-dynamic";

export default async function PlayerAtlasPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const { maps, locations } = await getCampaignAtlasData(member.campaign_id);
  return (
    <>
      <p className="muted">
        Explore the maps your GM has shared with campaign players.
      </p>
      <p className="muted">
        <Link href="/player">Return to overview</Link>
      </p>
      <MapAtlas locations={locations} maps={maps} mapLibraryHref="/player/maps" />
    </>
  );
}
