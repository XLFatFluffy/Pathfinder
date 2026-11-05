import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CharacterPdfPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "player") {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: character, error } = await supabase
    .from("campaign_characters")
    .select("id, name")
    .eq("campaign_id", member.campaign_id)
    .eq("id", characterId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load the character record: ${error.message}`);
  }
  if (!character) {
    notFound();
  }

  return (
    <>
      <p className="eyebrow">Editable Pathfinder 1e sheet</p>
      <h2>{character.name}</h2>
      <p className="muted">
        Fill in the PDF below. To keep your changes, use the PDF viewer&apos;s
        save or download control; edits are saved to your device, not to this
        campaign account.
      </p>
      <p className="muted">
        <Link href="/player/characters">Return to your characters</Link>
      </p>
      <section className="entry-card canonical-pdf-card">
        <p className="canonical-pdf-actions">
          <a
            className="button-link"
            href="/pathfinder-character-sheet.pdf"
            rel="noreferrer"
            target="_blank"
          >
            Open PDF in a full-page viewer
          </a>
          <a download href="/pathfinder-character-sheet.pdf">
            Download a blank PDF
          </a>
        </p>
        <iframe
          className="canonical-pdf-viewer"
          src="/pathfinder-character-sheet.pdf#view=FitH"
          title={`Editable Pathfinder character sheet for ${character.name}`}
        />
      </section>
    </>
  );
}
