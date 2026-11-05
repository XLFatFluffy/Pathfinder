import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import {
  isCharacterPdfFormData,
  type CharacterPdfFormData,
} from "@/lib/character-pdf";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CharacterPdfEditor from "./character-pdf-editor";

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
    .select("id, name, character_pdf_form_data")
    .eq("campaign_id", member.campaign_id)
    .eq("id", characterId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load the character record: ${error.message}`);
  }
  if (!character) {
    notFound();
  }
  if (!isCharacterPdfFormData(character.character_pdf_form_data)) {
    throw new Error("The saved character PDF form data is invalid.");
  }
  const formData: CharacterPdfFormData = character.character_pdf_form_data;

  return (
    <>
      <p className="eyebrow">Editable Pathfinder 1e sheet</p>
      <h2>{character.name}</h2>
      <p className="muted">
        Edit the original Pathfinder sheet here and save it to your campaign
        account. Your changes will be available when you reopen this character.
      </p>
      <p className="muted">
        <Link href="/player/characters">Return to your characters</Link>
      </p>
      <CharacterPdfEditor characterId={character.id} initialFormData={formData} />
    </>
  );
}
