"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createCampaignMap, type MapFormState } from "./actions";
import { uploadMapArtwork, validateMapArtwork } from "./upload-artwork";

type MapOption = {
  id: string;
  name: string;
};

export default function MapForm({
  campaignId,
  locations,
  maps,
}: {
  campaignId: string;
  locations: MapOption[];
  maps: MapOption[];
}) {
  const [state, setState] = useState<MapFormState>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function submitMap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({});
    const form = event.currentTarget;
    const formData = new FormData(form);
    const artwork = formData.get("artwork");

    if (!(artwork instanceof File)) {
      setState({ error: "Choose a map image to upload." });
      return;
    }

    try {
      const validationError = await validateMapArtwork(artwork);
      if (validationError) {
        setState({ error: validationError });
        return;
      }
    } catch (error) {
      setState({
        error:
          error instanceof Error
            ? `Unable to validate map artwork: ${error.message}`
            : "Unable to validate map artwork.",
      });
      return;
    }

    formData.delete("artwork");
    startTransition(async () => {
      let mapId: string;
      try {
        const created = await createCampaignMap(formData);
        if (created.error) {
          setState({ error: created.error });
          return;
        }
        mapId = created.mapId;
      } catch (error) {
        setState({
          error:
            error instanceof Error
              ? `The map creation outcome could not be confirmed: ${error.message} Refresh the map library before retrying.`
              : "The map creation outcome could not be confirmed. Refresh the map library before retrying.",
        });
        router.refresh();
        return;
      }

      setUploadProgress(0);
      let result: Awaited<ReturnType<typeof uploadMapArtwork>>;
      try {
        result = await uploadMapArtwork(
          campaignId,
          mapId,
          artwork,
          setUploadProgress,
        );
      } catch (error) {
        setUploadProgress(null);
        setState({
          error:
            error instanceof Error
              ? `The map record was saved, but artwork upload or its metadata save could not be confirmed: ${error.message} Refresh the map library before retrying.`
              : "The map record was saved, but artwork upload or its metadata save could not be confirmed. Refresh the map library before retrying.",
        });
        router.refresh();
        return;
      }
      setUploadProgress(null);
      if (result.error) {
        setState({
          error: `The map record was saved, but its artwork was not. ${result.error} You can retry from the map library.`,
        });
        router.refresh();
        return;
      }

      form.reset();
      setState({ message: "Map and artwork saved." });
      router.refresh();
    });
  }

  return (
    <section>
      <h3>Add a campaign map</h3>
      <form onSubmit={submitMap} className="form-stack">
        <label>
          Map name
          <input maxLength={160} name="name" required />
        </label>
        <label>
          Map level
          <select defaultValue="world" name="map_type" required>
            <option value="world">World</option>
            <option value="continent">Continent</option>
            <option value="region">Region</option>
            <option value="kingdom">Kingdom</option>
            <option value="city">City</option>
            <option value="settlement">Settlement</option>
            <option value="district">District</option>
            <option value="interior">Interior</option>
            <option value="dungeon">Dungeon</option>
          </select>
        </label>
        <label>
          Parent map
          <select defaultValue="" name="parent_map_id">
            <option value="">No parent</option>
            {maps.map((map) => (
              <option key={map.id} value={map.id}>
                {map.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Linked location
          <select defaultValue="" name="location_id">
            <option value="">No linked location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Description
          <textarea maxLength={20000} name="description" rows={3} />
        </label>
        <label>
          Map artwork (PNG, JPEG, WebP, or GIF; up to 100 MB)
          <input
            accept="image/png,image/jpeg,image/webp,image/gif"
            name="artwork"
            required
            type="file"
          />
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
        {uploadProgress !== null ? (
          <div aria-live="polite">
            <label htmlFor="map-upload-progress">Uploading artwork</label>
            <progress
              id="map-upload-progress"
              max={100}
              value={uploadProgress}
            />
            <span>{uploadProgress}%</span>
          </div>
        ) : null}
        <button disabled={isPending} type="submit">
          {isPending ? "Saving map…" : "Save map"}
        </button>
      </form>
    </section>
  );
}
