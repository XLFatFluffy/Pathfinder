"use client";

import { useActionState } from "react";
import {
  deleteCampaignQuest,
  saveCampaignQuest,
  type QuestFormState,
} from "./actions";

type QuestLocation = {
  id: string;
  name: string;
};

export type QuestFormValue = {
  id: string;
  name: string;
  status: string;
  summary: string;
  giver: string;
  location_id: string | null;
  player_visible: boolean;
  gm_notes: string;
};

const initialState: QuestFormState = {};

export default function QuestForm({
  quest,
  locations,
}: {
  quest?: QuestFormValue;
  locations: QuestLocation[];
}) {
  const [state, saveAction, isSaving] = useActionState(
    saveCampaignQuest,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCampaignQuest,
    initialState,
  );

  return (
    <section>
      <h3>{quest ? "Edit quest" : "Add a quest"}</h3>
      <form action={saveAction} className="form-stack">
        {quest ? <input name="quest_id" type="hidden" value={quest.id} /> : null}
        <label>
          Quest name
          <input
            defaultValue={quest?.name}
            maxLength={160}
            name="name"
            required
          />
        </label>
        <div className="form-grid">
          <label>
            Status
            <select defaultValue={quest?.status ?? "undiscovered"} name="status">
              <option value="undiscovered">Undiscovered</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="rewarded">Rewarded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label>
            Quest giver
            <input
              defaultValue={quest?.giver}
              maxLength={4000}
              name="giver"
            />
          </label>
        </div>
        <label>
          Linked location
          <select
            defaultValue={quest?.location_id ?? ""}
            name="location_id"
          >
            <option value="">No linked location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Player-facing summary
          <textarea
            defaultValue={quest?.summary}
            maxLength={4000}
            name="summary"
            rows={4}
          />
        </label>
        <label className="checkbox-label">
          <input
            defaultChecked={quest?.player_visible}
            name="player_visible"
            type="checkbox"
          />
          Share this quest with players
        </label>
        <details className="entry-edit">
          <summary>GM-only notes and secrets</summary>
          <label>
            Private notes
            <textarea
              defaultValue={quest?.gm_notes}
              maxLength={20000}
              name="gm_notes"
              rows={5}
            />
          </label>
        </details>
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
          {isSaving ? "Saving…" : quest ? "Save changes" : "Save quest"}
        </button>
      </form>
      {quest ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(event) => {
            if (!window.confirm("Delete this quest? This cannot be undone.")) {
              event.preventDefault();
            }
          }}
        >
          <input name="quest_id" type="hidden" value={quest.id} />
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
            {isDeleting ? "Deleting…" : "Delete quest"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
