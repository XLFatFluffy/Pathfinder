"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import {
  campaignMarkerTypes,
  type CampaignMarkerType,
} from "@/lib/campaign-markers";
import {
  campaignMapOverlayTypes,
  type CampaignMapOverlayType,
  type CampaignMapPoint,
} from "@/lib/campaign-map-overlays";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AtlasLayerMarker = {
  name: string;
  marker_type: CampaignMarkerType;
  x: number;
  y: number;
  description: string;
  location_type: string;
  status: string;
};

type AtlasLayerOverlay = {
  name: string;
  overlay_type: CampaignMapOverlayType;
  color: string;
  points: CampaignMapPoint[];
  status: string;
};

type AtlasPlayerLayer = {
  markers: AtlasLayerMarker[];
  overlays: AtlasLayerOverlay[];
};

export type AtlasLayerImportResult = {
  markersImported: number;
  markersSkipped: number;
  overlaysImported: number;
  overlaysSkipped: number;
  locationsCreated: number;
  error?: string;
};

const emptyResult = (): AtlasLayerImportResult => ({
  markersImported: 0,
  markersSkipped: 0,
  overlaysImported: 0,
  overlaysSkipped: 0,
  locationsCreated: 0,
});

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isMarkerType(value: unknown): value is CampaignMarkerType {
  return (
    typeof value === "string" &&
    campaignMarkerTypes.some((type) => type === value)
  );
}

function isOverlayType(value: unknown): value is CampaignMapOverlayType {
  return (
    typeof value === "string" &&
    campaignMapOverlayTypes.some((type) => type === value)
  );
}

function isPoint(value: unknown): value is CampaignMapPoint {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.x === "number" &&
    Number.isFinite(value.x) &&
    value.x >= 0 &&
    value.x <= 1 &&
    typeof value.y === "number" &&
    Number.isFinite(value.y) &&
    value.y >= 0 &&
    value.y <= 1
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseAtlasPlayerLayer(
  raw: string,
): { layer?: AtlasPlayerLayer; error?: string } {
  if (typeof raw !== "string" || raw.length > 500_000) {
    return { error: "Choose an atlas JSON file smaller than 500 KB." };
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { error: "The selected file is not valid JSON." };
  }
  if (
    !isRecord(value) ||
    value.map !== "continent_atlas" ||
    !Array.isArray(value.markers) ||
    !Array.isArray(value.overlays) ||
    value.markers.length > 1000 ||
    value.overlays.length > 100
  ) {
    return {
      error:
        "The file must be a continent_atlas layer with no more than 1,000 markers or 100 overlays.",
    };
  }

  const markers: AtlasLayerMarker[] = [];
  const markerNames = new Set<string>();
  for (const item of value.markers) {
    if (!isRecord(item)) {
      return { error: "A marker in the atlas layer is not an object." };
    }
    const {
      name,
      marker_type: markerType,
      x,
      y,
      description,
      location_type: locationType,
      status,
    } = item;
    if (
      typeof name !== "string" ||
      !isMarkerType(markerType) ||
      typeof x !== "number" ||
      !Number.isFinite(x) ||
      x < 0 ||
      x > 1 ||
      typeof y !== "number" ||
      !Number.isFinite(y) ||
      y < 0 ||
      y > 1 ||
      typeof description !== "string" ||
      description.length > 20000 ||
      typeof locationType !== "string" ||
      locationType.length > 80 ||
      typeof status !== "string" ||
      status.length > 200
    ) {
      return { error: "A marker in the atlas layer contains invalid fields." };
    }
    const key = name.trim().toLowerCase();
    if (!key || key.length > 160 || markerNames.has(key)) {
      return { error: "The atlas layer contains an empty or duplicate marker name." };
    }
    markerNames.add(key);
    markers.push({
      name: name.trim(),
      marker_type: markerType,
      x,
      y,
      description,
      location_type: locationType,
      status,
    });
  }

  const overlays: AtlasLayerOverlay[] = [];
  const overlayNames = new Set<string>();
  for (const item of value.overlays) {
    if (!isRecord(item)) {
      return { error: "An overlay in the atlas layer is not an object." };
    }
    const {
      name,
      overlay_type: overlayType,
      color,
      points,
      status,
    } = item;
    if (
      typeof name !== "string" ||
      !isOverlayType(overlayType) ||
      typeof color !== "string" ||
      !/^#[0-9a-f]{6}$/i.test(color) ||
      !Array.isArray(points) ||
      points.length < (overlayType === "region" ? 3 : 2) ||
      points.length > 1000 ||
      !points.every(isPoint) ||
      typeof status !== "string" ||
      status.length > 200
    ) {
      return { error: "An overlay in the atlas layer contains invalid fields." };
    }
    const key = name.trim().toLowerCase();
    if (!key || key.length > 160 || overlayNames.has(key)) {
      return { error: "The atlas layer contains an empty or duplicate overlay name." };
    }
    overlayNames.add(key);
    overlays.push({
      name: name.trim(),
      overlay_type: overlayType,
      color,
      points,
      status,
    });
  }
  return { layer: { markers, overlays } };
}

export async function importAtlasPlayerLayer(
  mapId: string,
  raw: string,
): Promise<AtlasLayerImportResult> {
  const result = emptyResult();
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { ...result, error: "Only the campaign GM can import an atlas layer." };
  }
  if (!isUuid(mapId)) {
    return { ...result, error: "Choose a valid campaign map." };
  }
  const parsed = parseAtlasPlayerLayer(raw);
  if (!parsed.layer) {
    return { ...result, error: parsed.error ?? "The prepared atlas layer contains invalid data." };
  }
  const atlasPlayerLayer = parsed.layer;

  const supabase = await createSupabaseServerClient();
  const { data: map, error: mapError } = await supabase
    .from("campaign_maps")
    .select("map_type, artwork_path")
    .eq("campaign_id", member.campaign_id)
    .eq("id", mapId)
    .maybeSingle();

  if (mapError) {
    return {
      ...result,
      error: `Unable to verify the selected map: ${mapError.message}`,
    };
  }
  if (!map || map.map_type !== "continent" || !map.artwork_path) {
    return {
      ...result,
      error: "Select a continent map with artwork before importing this atlas layer.",
    };
  }

  const [markersQuery, overlaysQuery, locationsQuery] = await Promise.all([
    supabase
      .from("campaign_map_markers")
      .select("name")
      .eq("campaign_id", member.campaign_id)
      .eq("map_id", mapId),
    supabase
      .from("campaign_map_overlays")
      .select("name")
      .eq("campaign_id", member.campaign_id)
      .eq("map_id", mapId),
    supabase
      .from("campaign_locations")
      .select("id, name")
      .eq("campaign_id", member.campaign_id)
      .limit(5000),
  ]);
  if (markersQuery.error) {
    return {
      ...result,
      error: `Unable to check existing map markers: ${markersQuery.error.message}`,
    };
  }
  if (overlaysQuery.error) {
    return {
      ...result,
      error: `Unable to check existing map overlays: ${overlaysQuery.error.message}`,
    };
  }
  if (locationsQuery.error) {
    return {
      ...result,
      error: `Unable to check existing locations: ${locationsQuery.error.message}`,
    };
  }

  const normalize = (value: string) => value.trim().toLowerCase();
  const existingMarkerNames = new Set(
    markersQuery.data.map((marker) => normalize(marker.name)),
  );
  const existingOverlayNames = new Set(
    overlaysQuery.data.map((overlay) => normalize(overlay.name)),
  );
  const locationsByName = new Map(
    locationsQuery.data.map((location) => [normalize(location.name), location.id]),
  );
  const newMarkers = atlasPlayerLayer.markers.filter(
    (marker) => !existingMarkerNames.has(normalize(marker.name)),
  );
  const newOverlays = atlasPlayerLayer.overlays.filter(
    (overlay) => !existingOverlayNames.has(normalize(overlay.name)),
  );
  result.markersSkipped = atlasPlayerLayer.markers.length - newMarkers.length;
  result.overlaysSkipped = atlasPlayerLayer.overlays.length - newOverlays.length;

  const markerRows = [];
  for (const marker of newMarkers) {
    let locationId = locationsByName.get(normalize(marker.name));
    if (!locationId) {
      const { data, error } = await supabase.rpc("create_campaign_location", {
        target_campaign_id: member.campaign_id,
        target_parent_id: null,
        target_name: marker.name,
        target_location_type: marker.location_type,
        target_description: marker.description,
        target_player_visible: false,
        target_gm_notes: [
          `Imported from campaign/maps/atlas_player_layer.json (${marker.status}).`,
          "Map position is approximate; review it against the authoritative continent atlas.",
        ].join(" "),
      });
      if (error) {
        return {
          ...result,
          error: `Unable to create location "${marker.name}": ${error.message}`,
        };
      }
      if (typeof data !== "string" || !isUuid(data)) {
        return {
          ...result,
          error: `The location "${marker.name}" was created but its ID could not be verified.`,
        };
      }
      locationId = data;
      locationsByName.set(normalize(marker.name), locationId);
      result.locationsCreated += 1;
    }

    markerRows.push({
      campaign_id: member.campaign_id,
      map_id: mapId,
      location_id: locationId,
      name: marker.name,
      marker_type: marker.marker_type,
      x: marker.x,
      y: marker.y,
      player_visible: false,
    });
  }

  if (markerRows.length) {
    const { error } = await supabase.from("campaign_map_markers").insert(markerRows);
    if (error) {
      return { ...result, error: `Unable to import map markers: ${error.message}` };
    }
    result.markersImported = markerRows.length;
  }

  if (newOverlays.length) {
    const { error } = await supabase.from("campaign_map_overlays").insert(
      newOverlays.map((overlay) => ({
        campaign_id: member.campaign_id,
        map_id: mapId,
        name: overlay.name,
        overlay_type: overlay.overlay_type,
        points: overlay.points,
        color: overlay.color,
        player_visible: false,
      })),
    );
    if (error) {
      return { ...result, error: `Unable to import map overlays: ${error.message}` };
    }
    result.overlaysImported = newOverlays.length;
  }

  revalidatePath("/gm/atlas");
  revalidatePath("/player/atlas");
  revalidatePath("/gm/locations");
  revalidatePath("/player/locations");
  return result;
}
