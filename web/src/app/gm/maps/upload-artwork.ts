"use client";

import {
  recordCampaignMapArtwork,
  type MapFormState,
} from "./actions";
import { Upload } from "tus-js-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { requireSupabaseEnvironment } from "@/lib/supabase/config";

const maximumArtworkBytes = 100 * 1024 * 1024;
const allowedArtworkTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export async function validateMapArtwork(file: File): Promise<string | null> {
  if (!file.size) {
    return "Choose a PNG, JPEG, WebP, or GIF map image.";
  }
  if (file.size > maximumArtworkBytes) {
    return "Map artwork cannot exceed 100 MB.";
  }
  if (!allowedArtworkTypes.has(file.type)) {
    return "Map artwork must be a PNG, JPEG, WebP, or GIF image.";
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isPng =
    file.type === "image/png" &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => header[index] === byte);
  const isJpeg =
    file.type === "image/jpeg" &&
    header[0] === 0xff &&
    header[1] === 0xd8 &&
    header[2] === 0xff;
  const isWebp =
    file.type === "image/webp" &&
    String.fromCharCode(...header.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...header.slice(8, 12)) === "WEBP";
  const isGif =
    file.type === "image/gif" &&
    ["GIF87a", "GIF89a"].includes(String.fromCharCode(...header.slice(0, 6)));

  return isPng || isJpeg || isWebp || isGif
    ? null
    : "The selected file does not match its image type.";
}

export async function uploadMapArtwork(
  campaignId: string,
  mapId: string,
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<MapFormState> {
  const validationError = await validateMapArtwork(file);
  if (validationError) {
    return { error: validationError };
  }

  const uploadResult = await uploadMapArtworkToStorage(
    campaignId,
    mapId,
    file,
    onProgress,
  );
  if (uploadResult.error) {
    return { error: uploadResult.error };
  }
  if (!uploadResult.artworkPath) {
    return { error: "The map artwork upload completed without a storage path." };
  }

  return recordCampaignMapArtwork(
    mapId,
    file.type,
    file.size,
    uploadResult.artworkPath,
  );
}

type MapArtworkUploadResult = MapFormState & {
  artworkPath?: string;
};

export async function uploadMapArtworkToStorage(
  campaignId: string,
  mapId: string,
  file: File,
  onProgress?: (percentage: number) => void,
  stageReplacement = false,
): Promise<MapArtworkUploadResult> {
  const supabase = createSupabaseBrowserClient();
  const { url, anonKey } = requireSupabaseEnvironment();
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    return { error: `Unable to access the upload session: ${sessionError.message}` };
  }
  if (!data.session) {
    return { error: "Sign in again before uploading map artwork." };
  }

  const artworkPath = stageReplacement
    ? `${campaignId}/${mapId}/artwork-${crypto.randomUUID()}`
    : `${campaignId}/${mapId}/artwork`;
  const uploadError = await new Promise<Error | null>((resolve) => {
    new Upload(file, {
      endpoint: `${url.replace(/\/$/, "")}/storage/v1/upload/resumable`,
      chunkSize: 6 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      removeFingerprintOnSuccess: true,
      uploadDataDuringCreation: true,
      headers: {
        authorization: `Bearer ${data.session.access_token}`,
        apikey: anonKey,
      },
      metadata: {
        bucketName: "campaign-maps",
        objectName: artworkPath,
        contentType: file.type,
        cacheControl: "60",
      },
      onProgress(bytesUploaded, bytesTotal) {
        onProgress?.(Math.floor((bytesUploaded / bytesTotal) * 100));
      },
      onError: resolve,
      onSuccess() {
        onProgress?.(100);
        resolve(null);
      },
    }).start();
  });

  return uploadError
    ? { error: `Unable to upload map artwork: ${uploadError.message}` }
    : { artworkPath };
}
