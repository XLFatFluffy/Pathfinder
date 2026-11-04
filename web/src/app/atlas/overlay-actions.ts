"use server";

import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  campaignMapOverlayTypes,
  type CampaignMapOverlay,
  type CampaignMapOverlayInput,
  type CampaignMapOverlayType,
  type CampaignMapPoint,
} from "@/lib/campaign-map-overlays";

type OverlayResult = {
  overlays?: CampaignMapOverlay[];
  id?: string;
  error?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isOverlayType(value: unknown): value is CampaignMapOverlayType {
  return (
    typeof value === "string" &&
    campaignMapOverlayTypes.some((type) => type === value)
  );
}

function isOverlayPoint(value: unknown): value is CampaignMapPoint {
  if (!value || typeof value !== "object") {
    return false;
  }
  const point = value as Record<string, unknown>;
  return (
    typeof point.x === "number" &&
    Number.isFinite(point.x) &&
    point.x >= 0 &&
    point.x <= 1 &&
    typeof point.y === "number" &&
    Number.isFinite(point.y) &&
    point.y >= 0 &&
    point.y <= 1
  );
}

function validatePoints(
  points: unknown,
  overlayType: CampaignMapOverlayType,
): points is CampaignMapPoint[] {
  return (
    Array.isArray(points) &&
    points.length >= (overlayType === "region" ? 3 : 2) &&
    points.length <= 1000 &&
    points.every(isOverlayPoint)
  );
}

export async function getCampaignMapOverlays(
  mapId: string,
): Promise<OverlayResult> {
  const member = await getCurrentCampaignMember();
  if (!member) {
    return { error: "Your campaign membership could not be verified." };
  }
  if (!isUuid(mapId)) {
    return { error: "Choose a valid campaign map." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: overlays, error } = await supabase
    .from("campaign_map_overlays")
    .select("id, map_id, name, overlay_type, points, color, player_visible")
    .eq("campaign_id", member.campaign_id)
    .eq("map_id", mapId)
    .order("name");

  if (error) {
    return { error: `Unable to load map overlays: ${error.message}` };
  }

  const parsed: CampaignMapOverlay[] = [];
  for (const overlay of overlays) {
    if (
      !isOverlayType(overlay.overlay_type) ||
      !validatePoints(overlay.points, overlay.overlay_type) ||
      !/^#[0-9a-f]{6}$/i.test(overlay.color)
    ) {
      return { error: `Overlay "${overlay.name}" has invalid stored data.` };
    }
    parsed.push({
      ...overlay,
      overlay_type: overlay.overlay_type,
      points: overlay.points,
    });
  }
  return { overlays: parsed };
}

export async function saveCampaignMapOverlay(
  input: CampaignMapOverlayInput,
): Promise<OverlayResult> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage map overlays." };
  }
  if (
    !input ||
    !isUuid(input.mapId) ||
    (input.id !== undefined && !isUuid(input.id)) ||
    typeof input.name !== "string" ||
    !input.name.trim() ||
    input.name.trim().length > 160 ||
    !isOverlayType(input.overlayType) ||
    !validatePoints(input.points, input.overlayType) ||
    typeof input.color !== "string" ||
    !/^#[0-9a-f]{6}$/i.test(input.color) ||
    typeof input.playerVisible !== "boolean"
  ) {
    return { error: "The map overlay contains invalid fields." };
  }

  const supabase = await createSupabaseServerClient();
  const values = {
    name: input.name.trim(),
    overlay_type: input.overlayType,
    points: input.points,
    color: input.color.toLowerCase(),
    player_visible: input.playerVisible,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("campaign_map_overlays")
      .update(values)
      .eq("campaign_id", member.campaign_id)
      .eq("map_id", input.mapId)
      .eq("id", input.id)
      .select("id")
      .maybeSingle();
    if (error) {
      return { error: `Unable to update map overlay: ${error.message}` };
    }
    if (!data) {
      return { error: "The map overlay was not found in this campaign." };
    }
    return { id: data.id };
  }

  const { data, error } = await supabase
    .from("campaign_map_overlays")
    .insert({
      ...values,
      campaign_id: member.campaign_id,
      map_id: input.mapId,
    })
    .select("id")
    .single();
  if (error) {
    return { error: `Unable to create map overlay: ${error.message}` };
  }
  return { id: data.id };
}

export async function deleteCampaignMapOverlay(
  overlayId: string,
): Promise<{ error?: string }> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can manage map overlays." };
  }
  if (!isUuid(overlayId)) {
    return { error: "Choose a valid map overlay." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("campaign_map_overlays")
    .delete()
    .eq("campaign_id", member.campaign_id)
    .eq("id", overlayId);
  if (error) {
    return { error: `Unable to delete map overlay: ${error.message}` };
  }
  return {};
}
