import Link from "next/link";
import MapAtlas from "@/app/atlas/map-atlas";
import { getCampaignAtlasMaps } from "@/lib/campaign-atlas";
import { getCurrentCampaignMember } from "@/lib/campaign-member";

export const dynamic = "force-dynamic";

export default async function GmAtlasPage() {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return null;
  }

  const maps = await getCampaignAtlasMaps(member.campaign_id);
  return (
    <>
      <p className="muted">
        Explore campaign maps without changing their artwork. Choose a map level
        or follow its hierarchy to move between maps.
      </p>
      <p className="muted">
        <Link href="/gm">Return to overview</Link>
      </p>
      <MapAtlas maps={maps} mapLibraryHref="/gm/maps" />
    </>
  );
}
