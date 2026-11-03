"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { replaceCampaignMapArtwork, type MapFormState } from "./actions";
import {
  uploadMapArtworkToStorage,
  validateMapArtwork,
} from "./upload-artwork";

export default function ReplaceArtworkForm({
  campaignId,
  mapId,
}: {
  campaignId: string;
  mapId: string;
}) {
  const [state, setState] = useState<MapFormState>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function submitReplacement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({});
    const form = event.currentTarget;
    const artwork = new FormData(form).get("artwork");
    if (!(artwork instanceof File)) {
      setState({ error: "Choose a map image to upload." });
      return;
    }

    const validationError = await validateMapArtwork(artwork);
    if (validationError) {
      setState({ error: validationError });
      return;
    }

    startTransition(async () => {
      setUploadProgress(0);
      const uploadResult = await uploadMapArtworkToStorage(
        campaignId,
        mapId,
        artwork,
        setUploadProgress,
        true,
      );
      setUploadProgress(null);
      if (uploadResult.error) {
        setState({ error: uploadResult.error });
        return;
      }

      const result = await replaceCampaignMapArtwork(
        mapId,
        artwork.type,
        artwork.size,
      );
      if (result.error) {
        setState({
          error: `Artwork uploaded, but its metadata could not be saved: ${result.error}`,
        });
        router.refresh();
        return;
      }

      form.reset();
      setState(result);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submitReplacement} className="replace-artwork-form">
      <label>
        {state.message ? "Replace artwork" : "Artwork file"}
        <input
          accept="image/png,image/jpeg,image/webp,image/gif"
          aria-label="Choose replacement map artwork"
          name="artwork"
          required
          type="file"
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
      {uploadProgress !== null ? (
        <div aria-live="polite">
          <label htmlFor={`map-upload-progress-${mapId}`}>
            Uploading replacement artwork
          </label>
          <progress
            id={`map-upload-progress-${mapId}`}
            max={100}
            value={uploadProgress}
          />
          <span>{uploadProgress}%</span>
        </div>
      ) : null}
      <button disabled={isPending} type="submit">
        {isPending ? "Uploading…" : "Replace artwork"}
      </button>
    </form>
  );
}
