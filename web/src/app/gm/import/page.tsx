import Link from "next/link";
import CampaignImportForm from "./import-form";

export const dynamic = "force-dynamic";

export default function CampaignImportPage() {
  return (
    <>
      <p className="eyebrow">GM workspace</p>
      <h2>AI-prepared campaign import</h2>
      <p className="muted">
        Use an AI tool to organize source material into the versioned JSON format.
        The file is validated here and never sent to an AI service by this app.
        The GM reviews every record before import.
      </p>
      <p className="notice">
        This importer creates records; it never edits existing records. Existing
        source keys are skipped on re-import, while name and link conflicts block
        the import before changes are made. A later database error can stop a
        multi-record import part-way through; completed records are listed and
        safe to retry by source key.
      </p>
      <p className="muted">
        For world lore, review canon status and visibility carefully. GM-only
        notes are stored separately where supported. Maps and artwork must still
        be uploaded through the map library.
      </p>
      <p className="muted">
        <Link href="/gm">Return to GM overview</Link>
        {" · "}
        <Link href="/gm/locations">Review locations</Link>
        {" · "}
        <Link href="/gm/npcs">Review NPCs</Link>
      </p>
      <section className="entry-list" aria-labelledby="campaign-import-heading">
        <h3 id="campaign-import-heading">Validate, review, and import</h3>
        <CampaignImportForm />
      </section>
    </>
  );
}
