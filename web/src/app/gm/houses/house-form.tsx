"use client";

import { useActionState } from "react";
import {
  deleteCampaignHouse,
  saveCampaignHouse,
  type HouseFormState,
} from "./actions";

type HouseReference = {
  id: string;
  name: string;
};

export type HouseFormValue = {
  id: string;
  name: string;
  heraldry_description: string;
  motto: string;
  description: string;
  player_visible: boolean;
  founding_history: string;
  current_ruler_id: string | null;
  ancestral_seat_location_id: string | null;
  holdings: string;
  succession: string;
  military_strength: string;
  wealth: string;
  resources: string;
  political_influence: string;
  religious_affiliations: string;
  objectives: string;
  secrets: string;
};

const initialState: HouseFormState = {};

export default function HouseForm({
  house,
  locations,
  npcs,
}: {
  house?: HouseFormValue;
  locations: HouseReference[];
  npcs: HouseReference[];
}) {
  const [state, saveAction, isSaving] = useActionState(
    saveCampaignHouse,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCampaignHouse,
    initialState,
  );

  return (
    <section>
      <h3>{house ? "Edit noble house" : "Add a noble house"}</h3>
      <form action={saveAction} className="form-stack">
        {house ? <input name="house_id" type="hidden" value={house.id} /> : null}
        <label>
          House name
          <input
            defaultValue={house?.name}
            maxLength={160}
            name="name"
            required
          />
        </label>
        <div className="form-grid">
          <label>
            Heraldry
            <textarea
              defaultValue={house?.heraldry_description}
              maxLength={2000}
              name="heraldry_description"
              rows={2}
            />
          </label>
          <label>
            Motto
            <input defaultValue={house?.motto} maxLength={500} name="motto" />
          </label>
        </div>
        <label>
          Player-facing description
          <textarea
            defaultValue={house?.description}
            maxLength={20000}
            name="description"
            rows={4}
          />
        </label>
        <label className="checkbox-label">
          <input
            defaultChecked={house?.player_visible}
            name="player_visible"
            type="checkbox"
          />
          Known to players
        </label>
        <details className="entry-edit">
          <summary>GM-only history and political details</summary>
          <div className="form-stack">
            <label>
              Founding history
              <textarea
                defaultValue={house?.founding_history}
                maxLength={20000}
                name="founding_history"
                rows={4}
              />
            </label>
            <div className="form-grid">
              <label>
                Current ruler
                <select
                  defaultValue={house?.current_ruler_id ?? ""}
                  name="current_ruler_id"
                >
                  <option value="">Not recorded</option>
                  {npcs.map((npc) => (
                    <option key={npc.id} value={npc.id}>
                      {npc.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ancestral seat
                <select
                  defaultValue={house?.ancestral_seat_location_id ?? ""}
                  name="ancestral_seat_location_id"
                >
                  <option value="">Not recorded</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Territorial holdings
              <textarea
                defaultValue={house?.holdings}
                maxLength={10000}
                name="holdings"
                rows={3}
              />
            </label>
            <label>
              Succession
              <textarea
                defaultValue={house?.succession}
                maxLength={10000}
                name="succession"
                rows={3}
              />
            </label>
            <div className="form-grid">
              <label>
                Military strength
                <textarea
                  defaultValue={house?.military_strength}
                  maxLength={4000}
                  name="military_strength"
                  rows={3}
                />
              </label>
              <label>
                Wealth
                <textarea
                  defaultValue={house?.wealth}
                  maxLength={4000}
                  name="wealth"
                  rows={3}
                />
              </label>
            </div>
            <label>
              Resources
              <textarea
                defaultValue={house?.resources}
                maxLength={10000}
                name="resources"
                rows={3}
              />
            </label>
            <label>
              Political influence
              <textarea
                defaultValue={house?.political_influence}
                maxLength={4000}
                name="political_influence"
                rows={3}
              />
            </label>
            <label>
              Religious affiliations
              <textarea
                defaultValue={house?.religious_affiliations}
                maxLength={4000}
                name="religious_affiliations"
                rows={3}
              />
            </label>
            <label>
              Current objectives
              <textarea
                defaultValue={house?.objectives}
                maxLength={10000}
                name="objectives"
                rows={3}
              />
            </label>
            <label>
              GM-only secrets
              <textarea
                defaultValue={house?.secrets}
                maxLength={20000}
                name="secrets"
                rows={4}
              />
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
        <button disabled={isSaving} type="submit">
          {isSaving ? "Saving…" : house ? "Save changes" : "Save house"}
        </button>
      </form>
      {house ? (
        <form
          action={deleteAction}
          className="delete-form"
          onSubmit={(event) => {
            if (!window.confirm("Delete this noble house? This cannot be undone.")) {
              event.preventDefault();
            }
          }}
        >
          <input name="house_id" type="hidden" value={house.id} />
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
            {isDeleting ? "Deleting…" : "Delete noble house"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
