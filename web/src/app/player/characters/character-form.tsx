"use client";

import { useActionState } from "react";
import {
  deletePlayerCharacter,
  savePlayerCharacter,
  type CharacterFormState,
} from "./actions";

export type CharacterSheet = {
  id: string;
  name: string;
  ancestry: string;
  class_name: string;
  level: number;
};

const initialState: CharacterFormState = {};

export default function CharacterForm({
  character,
}: {
  character?: CharacterSheet;
}) {
  const [state, saveAction, isSaving] = useActionState(
    savePlayerCharacter,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deletePlayerCharacter,
    initialState,
  );

  return (
    <article className="entry-card">
      <form action={saveAction} className="form-stack">
        {character ? (
          <input name="character_id" type="hidden" value={character.id} />
        ) : null}
        <div className="form-grid">
          <label>
            Character name
            <input
              defaultValue={character?.name}
              maxLength={160}
              name="name"
              required
            />
          </label>
          <label>
            Ancestry
            <input
              defaultValue={character?.ancestry}
              maxLength={120}
              name="ancestry"
              placeholder="Human, elf, dwarf..."
            />
          </label>
          <label>
            Class
            <input
              defaultValue={character?.class_name}
              maxLength={120}
              name="class_name"
              placeholder="Fighter, wizard, rogue..."
            />
          </label>
          <label>
            Level
            <input
              defaultValue={character?.level ?? 1}
              max={20}
              min={1}
              name="level"
              required
              type="number"
            />
          </label>
        </div>
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
          {isSaving ? "Saving…" : character ? "Save changes" : "Save character"}
        </button>
      </form>
      {character ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(event) => {
            if (
              !window.confirm(
                "Delete this character record? This cannot be undone.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input name="character_id" type="hidden" value={character.id} />
          {deleteState.error ? (
            <p className="error" role="alert">
              {deleteState.error}
            </p>
          ) : null}
          {deleteState.message ? (
            <p className="notice" role="status">
              {deleteState.message}
            </p>
          ) : null}
          <button disabled={isDeleting} type="submit">
            {isDeleting ? "Deleting…" : "Delete character"}
          </button>
        </form>
      ) : null}
    </article>
  );
}
