"use client";

import { useActionState } from "react";
import {
  deleteHouseRelationship,
  saveHouseRelationship,
  type HouseRelationshipFormState,
} from "./relationship-actions";
import {
  formatHouseRelationshipType,
  houseRelationshipTypes,
} from "./relationship-types";

type HouseOption = {
  id: string;
  name: string;
};

export type HouseRelationshipValue = {
  id: string;
  house_id: string;
  related_house_id: string;
  relationship_type: string;
  description: string;
  player_visible: boolean;
  gm_notes: string;
};

const initialState: HouseRelationshipFormState = {};
export default function HouseRelationshipForm({
  houses,
  relationship,
}: {
  houses: HouseOption[];
  relationship?: HouseRelationshipValue;
}) {
  const [state, saveAction, isSaving] = useActionState(
    saveHouseRelationship,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteHouseRelationship,
    initialState,
  );
  const relatedHouseOptions = houses.filter(
    (house) => house.id !== relationship?.house_id,
  );

  return (
    <section>
      <h3>{relationship ? "Edit relationship" : "Record a relationship"}</h3>
      <form action={saveAction} className="form-stack">
        {relationship ? (
          <input
            name="relationship_id"
            type="hidden"
            value={relationship.id}
          />
        ) : null}
        <div className="form-grid">
          <label>
            House
            <select
              defaultValue={relationship?.house_id ?? ""}
              name="house_id"
              required
            >
              <option value="" disabled>
                Choose a house
              </option>
              {houses.map((house) => (
                <option key={house.id} value={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Related house
            <select
              defaultValue={relationship?.related_house_id ?? ""}
              name="related_house_id"
              required
            >
              <option value="" disabled>
                Choose a house
              </option>
              {relatedHouseOptions.map((house) => (
                <option key={house.id} value={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Relationship
          <select
            defaultValue={relationship?.relationship_type ?? "allied"}
            name="relationship_type"
            required
          >
            {houseRelationshipTypes.map((type) => (
              <option key={type} value={type}>
                {formatHouseRelationshipType(type)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Player-facing description
          <textarea
            defaultValue={relationship?.description}
            maxLength={10000}
            name="description"
            rows={3}
          />
        </label>
        <label>
          GM-only notes
          <textarea
            defaultValue={relationship?.gm_notes}
            maxLength={20000}
            name="gm_notes"
            rows={3}
          />
        </label>
        <label className="checkbox-label">
          <input
            defaultChecked={relationship?.player_visible}
            name="player_visible"
            type="checkbox"
          />
          Share this relationship with players
        </label>
        <details className="entry-edit">
          <summary>Record a history note</summary>
          <div className="form-grid">
            <label>
              Campaign date
              <input maxLength={120} name="campaign_date" />
            </label>
            <label>
              Reason for the change
              <input maxLength={4000} name="reason" />
            </label>
          </div>
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
        <button disabled={isSaving || houses.length < 2} type="submit">
          {isSaving
            ? "Saving…"
            : relationship
              ? "Save changes"
              : "Save relationship"}
        </button>
        {houses.length < 2 ? (
          <p className="muted">Add at least two houses to record a relationship.</p>
        ) : null}
      </form>
      {relationship ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(event) => {
            if (
              !window.confirm(
                "Delete this house relationship and its history? This cannot be undone.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input
            name="relationship_id"
            type="hidden"
            value={relationship.id}
          />
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
            {isDeleting ? "Deleting…" : "Delete relationship"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
