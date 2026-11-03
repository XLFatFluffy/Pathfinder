"use client";

import { useActionState } from "react";
import { createCampaignLocation, type LocationFormState } from "./actions";

type ParentLocation = {
  id: string;
  name: string;
};

const initialState: LocationFormState = {};

export default function LocationForm({
  parents,
}: {
  parents: ParentLocation[];
}) {
  const [state, action, isPending] = useActionState(
    createCampaignLocation,
    initialState,
  );

  return (
    <section>
      <h3>Add a location</h3>
      <form action={action} className="form-stack">
        <label>
          Location name
          <input maxLength={160} name="name" required />
        </label>
        <label>
          Type
          <input
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
          <select defaultValue="" name="parent_id">
            <option value="">No parent</option>
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Player-facing description
          <textarea maxLength={20000} name="description" rows={4} />
        </label>
        <label>
          GM-only notes
          <textarea maxLength={20000} name="gm_notes" rows={4} />
        </label>
        <label className="checkbox-label">
          <input name="player_visible" type="checkbox" />
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
        <button disabled={isPending} type="submit">
          {isPending ? "Saving…" : "Save location"}
        </button>
      </form>
    </section>
  );
}
