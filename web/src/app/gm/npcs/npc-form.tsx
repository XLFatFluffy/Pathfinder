"use client";

import { useActionState } from "react";
import {
  deleteCampaignNpc,
  saveCampaignNpc,
  type NpcFormState,
} from "./actions";

type NpcLocation = {
  id: string;
  name: string;
};

export type NpcFormValue = {
  id: string;
  name: string;
  race: string;
  age: string;
  gender: string;
  occupation: string;
  titles: string;
  description: string;
  status: string;
  location_id: string | null;
  player_visible: boolean;
  gm_notes: string;
};

const initialState: NpcFormState = {};

export default function NpcForm({
  locations,
  npc,
}: {
  locations: NpcLocation[];
  npc?: NpcFormValue;
}) {
  const [state, saveAction, isSaving] = useActionState(
    saveCampaignNpc,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCampaignNpc,
    initialState,
  );

  return (
    <section>
      <h3>{npc ? "Edit NPC" : "Add an NPC"}</h3>
      <form action={saveAction} className="form-stack">
        {npc ? <input name="npc_id" type="hidden" value={npc.id} /> : null}
        <label>
          Name
          <input defaultValue={npc?.name} maxLength={160} name="name" required />
        </label>
        <div className="form-grid">
          <label>
            Race
            <input defaultValue={npc?.race} maxLength={80} name="race" />
          </label>
          <label>
            Age
            <input
              defaultValue={npc?.age}
              maxLength={80}
              name="age"
              placeholder="Age or age range"
            />
          </label>
          <label>
            Gender
            <input defaultValue={npc?.gender} maxLength={80} name="gender" />
          </label>
          <label>
            Occupation
            <input
              defaultValue={npc?.occupation}
              maxLength={120}
              name="occupation"
            />
          </label>
        </div>
        <label>
          Titles
          <textarea
            defaultValue={npc?.titles}
            maxLength={2000}
            name="titles"
            rows={2}
          />
        </label>
        <label>
          Current location
          <select defaultValue={npc?.location_id ?? ""} name="location_id">
            <option value="">No linked location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Player-facing description
          <textarea
            defaultValue={npc?.description}
            maxLength={20000}
            name="description"
            rows={4}
          />
        </label>
        <label>
          Status
          <input
            defaultValue={npc?.status ?? "Alive"}
            list="npc-statuses"
            maxLength={80}
            name="status"
            required
          />
          <datalist id="npc-statuses">
            <option value="Alive" />
            <option value="Dead" />
            <option value="Missing" />
            <option value="Imprisoned" />
            <option value="Unknown" />
          </datalist>
        </label>
        <div className="form-grid">
          <label>
            Status change campaign date
            <input maxLength={120} name="status_date" />
          </label>
          <label>
            Status change reason
            <input maxLength={2000} name="status_reason" />
          </label>
        </div>
        <label>
          GM-only notes
          <textarea
            defaultValue={npc?.gm_notes}
            maxLength={20000}
            name="gm_notes"
            rows={4}
          />
        </label>
        <label className="checkbox-label">
          <input
            defaultChecked={npc?.player_visible}
            name="player_visible"
            type="checkbox"
          />
          Known to players
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
          {isSaving ? "Saving…" : npc ? "Save changes" : "Save NPC"}
        </button>
      </form>
      {npc ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(event) => {
            if (!window.confirm("Delete this NPC? This cannot be undone.")) {
              event.preventDefault();
            }
          }}
        >
          <input name="npc_id" type="hidden" value={npc.id} />
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
            {isDeleting ? "Deleting…" : "Delete NPC"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
