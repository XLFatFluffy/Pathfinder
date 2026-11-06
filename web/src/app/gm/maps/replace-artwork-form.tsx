"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
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
  const [isValidating, setIsValidating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const submissionInProgress = useRef(false);
  const router = useRouter();

  async function submitReplacement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) {
      return;
    }
    setState({});
    const form = event.currentTarget;
    const artwork = new FormData(form).get("artwork");
    if (!(artwork instanceof File)) {
      setState({ error: "Choose a map image to upload." });
      return;
    }

    submissionInProgress.current = true;
    setIsValidating(true);
    try {
      const validationError = await validateMapArtwork(artwork);
      if (validationError) {
        setState({ error: validationError });
        submissionInProgress.current = false;
        setIsValidating(false);
        return;
      }
    } catch (error) {
      setState({
        error:
          error instanceof Error
            ? `Unable to validate map artwork: ${error.message}`
            : "Unable to validate map artwork.",
      });
      submissionInProgress.current = false;
      setIsValidating(false);
      return;
    }

    setIsValidating(false);
    startTransition(async () => {
      try {
        setUploadProgress(0);
        let uploadResult: MapFormState;
        try {
          uploadResult = await uploadMapArtworkToStorage(
            campaignId,
            mapId,
            artwork,
            setUploadProgress,
            true,
          );
        } catch (error) {
          setUploadProgress(null);
          setState({
            error:
              error instanceof Error
                ? `Unable to confirm artwork upload: ${error.message}. Refresh the map library before retrying.`
                : "Unable to confirm artwork upload. Refresh the map library before retrying.",
          });
          router.refresh();
          return;
        }
        setUploadProgress(null);
        if (uploadResult.error) {
          setState({ error: uploadResult.error });
          return;
        }

        let result: MapFormState;
        try {
          result = await replaceCampaignMapArtwork(
            mapId,
            artwork.type,
            artwork.size,
          );
        } catch (error) {
          setState({
            error:
              error instanceof Error
                ? `Artwork was uploaded, but its metadata update could not be confirmed: ${error.message}. Refresh the map library before retrying.`
                : "Artwork was uploaded, but its metadata update could not be confirmed. Refresh the map library before retrying.",
          });
          router.refresh();
          return;
        }
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
      } finally {
        submissionInProgress.current = false;
      }
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
      <button disabled={isPending || isValidating} type="submit">
        {isValidating
          ? "Validating artwork…"
          : isPending
            ? "Uploading…"
            : "Replace artwork"}
      </button>
    </form>
  );
}
