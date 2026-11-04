"use client";

import { useActionState } from "react";
import {
  deleteCampaignLocation,
  saveCampaignLocation,
  type LocationFormState,
} from "./actions";

type ParentLocation = {
  id: string;
  name: string;
};

export type LocationFormValue = {
  id: string;
  name: string;
  location_type: string;
  description: string;
  parent_id: string | null;
  player_visible: boolean;
  gm_notes: string;
};

const initialState: LocationFormState = {};

export default function LocationForm({
  parents,
  location,
}: {
  parents: ParentLocation[];
  location?: LocationFormValue;
}) {
  const [state, saveAction, isSaving] = useActionState(
    saveCampaignLocation,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCampaignLocation,
    initialState,
  );

  return (
    <section>
      <h3>{location ? "Edit location" : "Add a location"}</h3>
      <form action={saveAction} className="form-stack">
        {location ? (
          <input name="location_id" type="hidden" value={location.id} />
        ) : null}
        <label>
          Location name
          <input
            defaultValue={location?.name}
            maxLength={160}
            name="name"
            required
          />
        </label>
        <label>
          Type
          <input
            defaultValue={location?.location_type}
            list="location-types"
            maxLength={80}
            name="location_type"
            placeholder="City, region, dungeon…"
          />
          <datalist id="location-types">
            <option value="continent" />
            <option value="region" />
            <option value="kingdom" />
            <option value="city" />
            <option value="settlement" />
            <option value="building" />
            <option value="dungeon" />
          </datalist>
        </label>
        <label>
          Parent location
          <select defaultValue={location?.parent_id ?? ""} name="parent_id">
            <option value="">No parent</option>
            {parents
              .filter((parent) => parent.id !== location?.id)
              .map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Player-facing description
          <textarea
            defaultValue={location?.description}
            maxLength={20000}
            name="description"
            rows={4}
          />
        </label>
        <label>
          GM-only notes
          <textarea
            defaultValue={location?.gm_notes}
            maxLength={20000}
            name="gm_notes"
            rows={4}
          />
        </label>
        <label className="checkbox-label">
          <input
            defaultChecked={location?.player_visible}
            name="player_visible"
            type="checkbox"
          />
          Visible to players
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
          {isSaving
            ? "Saving…"
            : location
              ? "Save changes"
              : "Save location"}
        </button>
      </form>
      {location ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(event) => {
            if (!window.confirm("Delete this location? This cannot be undone.")) {
              event.preventDefault();
            }
          }}
        >
          <input name="location_id" type="hidden" value={location.id} />
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
            {isDeleting ? "Deleting…" : "Delete location"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
