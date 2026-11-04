"use client";

import { useActionState } from "react";
import { saveGmCharacterNotes, type GmCharacterNotesFormState } from "./actions";

const initialState: GmCharacterNotesFormState = {};

export default function GmCharacterNotesForm({
  characterId,
  notes,
}: {
  characterId: string;
  notes: string;
}) {
  const [state, action, isSaving] = useActionState(
    saveGmCharacterNotes,
    initialState,
  );

  return (
    <form action={action} className="form-stack">
      <input name="character_id" type="hidden" value={characterId} />
      <label>
        Private GM notes
        <textarea
          defaultValue={notes}
          maxLength={20000}
          name="notes"
          rows={4}
        />
      </label>
      {state.error ? (
        <p className="error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="notice" role="status">
          {state.message}
        </p>
      ) : null}
      <button disabled={isSaving} type="submit">
        {isSaving ? "Saving…" : "Save GM notes"}
      </button>
    </form>
  );
}
