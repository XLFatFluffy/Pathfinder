"use server";

import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  campaignMarkerTypes,
  type CampaignMapMarker,
  type CampaignMapMarkerInput,
  type CampaignMarkerType,
} from "@/lib/campaign-markers";

type ArtworkResult = {
  url?: string;
  error?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isCampaignMarkerType(value: string): value is CampaignMarkerType {
  return campaignMarkerTypes.some((type) => type === value);
}

export async function getCampaignMapArtworkUrl(
  mapId: string,
): Promise<ArtworkResult> {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return { error: "Your campaign membership could not be verified." };
  }
  if (!isUuid(mapId)) {
    return { error: "Choose a valid campaign map." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: map, error } = await supabase
    .from("campaign_maps")
    .select("artwork_path")
    .eq("campaign_id", member.campaign_id)
    .eq("id", mapId)
    .maybeSingle();

  if (error) {
    return { error: `Unable to load map artwork: ${error.message}` };
  }
  if (!map?.artwork_path) {
    return { error: "This map has no artwork available to view." };
  }

  const { data, error: urlError } = await supabase.storage
    .from("campaign-maps")
    .createSignedUrl(map.artwork_path, 60);
  if (urlError) {
    return { error: `Unable to open map artwork: ${urlError.message}` };
  }

  return { url: data.signedUrl };
}

type MarkerResult = {
  markers?: CampaignMapMarker[];
  id?: string;
  error?: string;
};

export async function getCampaignMapMarkers(
  mapId: string,
): Promise<MarkerResult> {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return { error: "Your campaign membership could not be verified." };
  }
  if (!isUuid(mapId)) {
    return { error: "Choose a valid campaign map." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: markers, error } = await supabase
    .from("campaign_map_markers")
    .select(
      "id, source_id, map_id, location_id, name, marker_type, x, y, player_visible",
    )
    .eq("campaign_id", member.campaign_id)
    .eq("map_id", mapId)
    .order("name");

  if (error) {
    return { error: `Unable to load map markers: ${error.message}` };
  }
  if (markers.some((marker) => !isCampaignMarkerType(marker.marker_type))) {
    return { error: "A map marker has an unsupported marker type." };
  }

  const locationIds = [
    ...new Set(
      markers.flatMap((marker) => (marker.location_id ? [marker.location_id] : [])),
    ),
  ];
  const locationNames = new Map<string, string>();
  if (locationIds.length) {
    const { data: locations, error: locationsError } = await supabase
      .from("campaign_locations")
      .select("id, name")
      .eq("campaign_id", member.campaign_id)
      .in("id", locationIds);
    if (locationsError) {
      return { error: `Unable to load marker locations: ${locationsError.message}` };
    }
    for (const location of locations) {
      locationNames.set(location.id, location.name);
    }
  }

  return {
    markers: markers.map((marker) => ({
      ...marker,
      marker_type: marker.marker_type,
      location_name: marker.location_id
        ? (locationNames.get(marker.location_id) ?? null)
        : null,
    })),
  };
}

export async function saveCampaignMapMarker(
  input: CampaignMapMarkerInput,
): Promise<MarkerResult> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage map markers." };
  }
  if (
    !input ||
    !isUuid(input.mapId) ||
    (input.id !== undefined && !isUuid(input.id)) ||
    (input.locationId !== "" && !isUuid(input.locationId)) ||
    typeof input.name !== "string" ||
    !input.name.trim() ||
    input.name.trim().length > 160 ||
    !campaignMarkerTypes.includes(input.markerType) ||
    !Number.isFinite(input.x) ||
    !Number.isFinite(input.y) ||
    input.x < 0 ||
    input.x > 1 ||
    input.y < 0 ||
    input.y > 1 ||
    typeof input.playerVisible !== "boolean"
  ) {
    return { error: "The map marker contains invalid fields." };
  }

  const supabase = await createSupabaseServerClient();
  const values = {
    location_id: input.locationId || null,
    name: input.name.trim(),
    marker_type: input.markerType,
    x: input.x,
    y: input.y,
    player_visible: input.playerVisible,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("campaign_map_markers")
      .update(values)
      .eq("campaign_id", member.campaign_id)
      .eq("map_id", input.mapId)
      .eq("id", input.id)
      .select("id")
      .maybeSingle();
    if (error) {
      return { error: `Unable to update map marker: ${error.message}` };
    }
    if (!data) {
      return { error: "The map marker was not found in this campaign." };
    }
    return { id: data.id };
  }

  const { data, error } = await supabase
    .from("campaign_map_markers")
    .insert({
      ...values,
      campaign_id: member.campaign_id,
      map_id: input.mapId,
    })
    .select("id")
    .single();
  if (error) {
    return { error: `Unable to create map marker: ${error.message}` };
  }
  return { id: data.id };
}

export async function deleteCampaignMapMarker(
  markerId: string,
): Promise<{ error?: string }> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage map markers." };
  }
  if (!isUuid(markerId)) {
    return { error: "Choose a valid map marker." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_map_markers")
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("id", markerId)
    .select("id")
    .maybeSingle();
  if (error) {
    return { error: `Unable to delete map marker: ${error.message}` };
  }
  if (!data) {
    return { error: "The map marker was not found in this campaign." };
  }
  return {};
}
