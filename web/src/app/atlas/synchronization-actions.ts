"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import atlasLayer from "../../../../campaign/maps/atlas_player_layer.json";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { getAllSupabaseRows } from "@/lib/supabase-pagination";
import {
  parseAtlasSyncLayers,
  planAtlasSync,
  type AtlasSyncLocation,
  type AtlasSyncMap,
  type AtlasSyncMarker,
  type AtlasSyncOverlay,
  type AtlasSyncPlan,
  type AtlasSyncSnapshot,
} from "@/lib/campaign-atlas-sync";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PreviewResult = {
  signature?: string;
  plan?: AtlasSyncPlan;
  error?: string;
};

type ApplyResult = {
  runId?: string;
  added?: number;
  updated?: number;
  removed?: number;
  error?: string;
};

export async function getAvailableAtlasSyncRollback(
  mapId: string,
): Promise<{ runId?: string; error?: string }> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can inspect atlas rollback status." };
  }
  if (!isUuid(mapId)) {
    return { error: "Choose a valid campaign map." };
  }
  const supabase = await createSupabaseServerClient();
  const { data: run, error } = await supabase
    .from("campaign_atlas_sync_runs")
    .select("id, status")
    .eq("campaign_id", member.campaign_id)
    .eq("map_id", mapId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    return { error: `Unable to load rollback status: ${error.message}` };
  }
  if (run && ["applying", "applied", "partial"].includes(run.status)) {
    return { runId: run.id };
  }
  return {};
}

type SyncRun = {
  id: string;
  campaign_id: string;
  map_id: string;
  source_ids: string[];
  location_source_ids: string[];
  before_state: {
    map: Pick<AtlasSyncMap, "id" | "source_id" | "parent_map_id">;
    markers: Record<string, unknown>[];
    overlays: Record<string, unknown>[];
    locations: Array<{
      id: string;
      source_id: string | null;
      name: string;
      location_type: string;
      description: string;
      player_visible: boolean;
    }>;
  };
  status: "applying" | "applied" | "partial" | "rolled_back";
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function signatureFor(plan: AtlasSyncPlan, snapshot: AtlasSyncSnapshot) {
  return createHash("sha256")
    .update(JSON.stringify({ plan, snapshot }))
    .digest("hex");
}

async function getSyncContext(mapId: string) {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can synchronize atlas data." } as const;
  }
  if (!isUuid(mapId)) {
    return { error: "Choose a valid campaign map." } as const;
  }

  const parsed = parseAtlasSyncLayers(atlasLayer);
  if (!parsed.sources) {
    return {
      error: `The repository atlas layer is invalid: ${parsed.error ?? "unknown validation error"}`,
    } as const;
  }

  const supabase = await createSupabaseServerClient();
  const { data: map, error: mapError } = await supabase
    .from("campaign_maps")
    .select("id, name, source_id, parent_map_id, map_type, artwork_path")
    .eq("campaign_id", member.campaign_id)
    .eq("id", mapId)
    .maybeSingle();
  if (mapError) {
    return {
      error: `Unable to verify the selected map: ${mapError.message}`,
    } as const;
  }
  if (!map || !map.artwork_path) {
    return {
      error:
        "Select a campaign map with artwork before synchronizing repository content.",
    } as const;
  }
  const sourceCandidates = map.source_id
    ? parsed.sources.filter((source) => source.map_source_id === map.source_id)
    : parsed.sources.filter(
        (source) =>
          source.map_type === map.map_type &&
          source.map_name.trim().toLocaleLowerCase() ===
            map.name.trim().toLocaleLowerCase(),
      );
  if (sourceCandidates.length !== 1) {
    return {
      error:
        sourceCandidates.length === 0
          ? `No repository layer matches map "${map.name}" (${map.map_type}). Add a layer with this map's name and type, then synchronize again.`
          : `More than one repository layer matches map "${map.name}". Assign its stable source ID before synchronizing.`,
    } as const;
  }
  const source = sourceCandidates[0];
  if (source.map_type !== map.map_type) {
    return {
      error: `Repository layer "${source.map_source_id}" has map type "${source.map_type}", but the selected map is "${map.map_type}".`,
    } as const;
  }

  const [mapsResult, markersResult, overlaysResult, locationsResult] =
    await Promise.all([
      getAllSupabaseRows((from, to) =>
        supabase
          .from("campaign_maps")
          .select("id, source_id, parent_map_id, player_visible")
          .eq("campaign_id", member.campaign_id)
          .order("id")
          .range(from, to)
          .returns<AtlasSyncMap[]>(),
      ),
      getAllSupabaseRows((from, to) =>
        supabase
          .from("campaign_map_markers")
          .select(
            "id, source_id, location_id, name, marker_type, x, y, player_visible",
          )
          .eq("campaign_id", member.campaign_id)
          .eq("map_id", mapId)
          .order("id")
          .range(from, to)
          .returns<AtlasSyncMarker[]>(),
      ),
      getAllSupabaseRows((from, to) =>
        supabase
          .from("campaign_map_overlays")
          .select(
            "id, source_id, name, overlay_type, points, color, player_visible",
          )
          .eq("campaign_id", member.campaign_id)
          .eq("map_id", mapId)
          .order("id")
          .range(from, to)
          .returns<AtlasSyncOverlay[]>(),
      ),
      getAllSupabaseRows((from, to) =>
        supabase
          .from("campaign_locations")
          .select("id, source_id, name, location_type, description, player_visible")
          .eq("campaign_id", member.campaign_id)
          .order("id")
          .range(from, to)
          .returns<AtlasSyncLocation[]>(),
      ),
  ]);
  if (mapsResult.error) {
    return { error: `Unable to load campaign maps: ${mapsResult.error}` } as const;
  }
  if (markersResult.error) {
    return {
      error: `Unable to load existing map markers: ${markersResult.error}`,
    } as const;
  }
  if (overlaysResult.error) {
    return {
      error: `Unable to load existing map overlays: ${overlaysResult.error}`,
    } as const;
  }
  if (locationsResult.error) {
    return {
      error: `Unable to load campaign locations: ${locationsResult.error}`,
    } as const;
  }

  const snapshot: AtlasSyncSnapshot = {
    maps: mapsResult.data ?? [],
    markers: markersResult.data ?? [],
    overlays: overlaysResult.data ?? [],
    locations: locationsResult.data ?? [],
  };
  const plan = planAtlasSync(source, mapId, snapshot);
  return { member, supabase, plan, snapshot } as const;
}

export async function previewCampaignAtlasSync(
  mapId: string,
): Promise<PreviewResult> {
  const context = await getSyncContext(mapId);
  if ("error" in context) {
    return { error: context.error };
  }
  return {
    signature: signatureFor(context.plan, context.snapshot),
    plan: context.plan,
  };
}

export async function applyCampaignAtlasSync(
  mapId: string,
  approvedSignature: string,
  confirmRemovals: boolean,
): Promise<ApplyResult> {
  const context = await getSyncContext(mapId);
  if ("error" in context) {
    return { error: context.error };
  }
  const { member, supabase, plan, snapshot } = context;
  if (signatureFor(plan, snapshot) !== approvedSignature) {
    return {
      error:
        "The atlas or database changed after preview. Generate a new preview before applying.",
    };
  }
  if (plan.conflicts.length) {
    return {
      error: "Resolve all source matching conflicts before applying changes.",
    };
  }
  const removalCount = plan.markerRemovals.length + plan.overlayRemovals.length;
  if (removalCount > 0 && !confirmRemovals) {
    return {
      error: "Confirm the listed marker and overlay removals before applying.",
    };
  }
  if (plan.changes.length === 0) {
    return { added: 0, updated: 0, removed: 0 };
  }

  const allMarkersResult = await getAllSupabaseRows((from, to) =>
    supabase
      .from("campaign_map_markers")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("map_id", mapId)
      .order("id")
      .range(from, to),
  );
  if (allMarkersResult.error) {
    return {
      error: `Unable to create the rollback snapshot: ${allMarkersResult.error}`,
    };
  }
  const allOverlaysResult = await getAllSupabaseRows((from, to) =>
    supabase
      .from("campaign_map_overlays")
      .select("*")
      .eq("campaign_id", member.campaign_id)
      .eq("map_id", mapId)
      .order("id")
      .range(from, to),
  );
  if (allOverlaysResult.error) {
    return {
      error: `Unable to create the rollback snapshot: ${allOverlaysResult.error}`,
    };
  }
  const allMarkers = allMarkersResult.data ?? [];
  const allOverlays = allOverlaysResult.data ?? [];

  const touchedMarkerIds = new Set([
    ...plan.markerUpserts.flatMap((item) => (item.id ? [item.id] : [])),
    ...plan.markerRemovals.map((item) => item.id),
  ]);
  const touchedOverlayIds = new Set([
    ...plan.overlayUpserts.flatMap((item) => (item.id ? [item.id] : [])),
    ...plan.overlayRemovals.map((item) => item.id),
  ]);
  const touchedLocationIds = new Set(
    plan.locationUpserts.flatMap((item) => (item.id ? [item.id] : [])),
  );
  const markerRows = allMarkers.filter((row: { id: string }) =>
    touchedMarkerIds.has(row.id),
  ) as Record<string, unknown>[];
  const overlayRows = allOverlays.filter((row: { id: string }) =>
    touchedOverlayIds.has(row.id),
  ) as Record<string, unknown>[];
  const locationsBefore = context.plan.locationUpserts
    .filter((item) => item.id && touchedLocationIds.has(item.id))
    .map((item) => item.id as string);
  const { data: locationRows, error: locationRowsError } = locationsBefore.length
    ? await supabase
        .from("campaign_locations")
        .select(
          "id, source_id, name, location_type, description, player_visible",
        )
        .eq("campaign_id", member.campaign_id)
        .in("id", locationsBefore)
    : { data: [], error: null };
  if (locationRowsError) {
    return {
      error: `Unable to create the rollback snapshot: ${locationRowsError.message}`,
    };
  }
  const { data: mapBefore, error: mapBeforeError } = await supabase
    .from("campaign_maps")
    .select("id, source_id, parent_map_id")
    .eq("campaign_id", member.campaign_id)
    .eq("id", mapId)
    .single();
  if (mapBeforeError) {
    return {
      error: `Unable to create the rollback snapshot: ${mapBeforeError.message}`,
    };
  }
  const sourceIds = [
    ...new Set([
      ...plan.markerUpserts.map((item) => item.values.source_id),
      ...plan.markerRemovals.map((item) => item.source_id),
      ...plan.overlayUpserts.map((item) => item.values.source_id),
      ...plan.overlayRemovals.map((item) => item.source_id),
    ]),
  ];
  const locationSourceIds = [
    ...new Set(
      plan.locationUpserts.map((item) => item.values.source_id),
    ),
  ];
  const { data: run, error: runError } = await supabase
    .from("campaign_atlas_sync_runs")
    .insert({
      campaign_id: member.campaign_id,
      map_id: mapId,
      source_ids: sourceIds,
      location_source_ids: locationSourceIds,
      before_state: {
        map: mapBefore,
        markers: markerRows,
        overlays: overlayRows,
        locations: locationRows,
      },
    })
    .select("id")
    .single();
  if (runError) {
    return {
      error: `Unable to preserve a rollback point: ${runError.message}`,
    };
  }
  const runId = run.id;

  async function partialFailure(error: string): Promise<ApplyResult> {
    const { error: statusError } = await supabase
      .from("campaign_atlas_sync_runs")
      .update({ status: "partial" })
      .eq("campaign_id", member.campaign_id)
      .eq("id", runId);
    return {
      runId,
      error: statusError
        ? `${error} The partial synchronization could not be marked for rollback: ${statusError.message}`
        : error,
    };
  }

  if (plan.mapUpdate) {
    const { error } = await supabase
      .from("campaign_maps")
      .update({
        ...plan.mapUpdate,
        updated_at: new Date().toISOString(),
      })
      .eq("campaign_id", member.campaign_id)
      .eq("id", mapId);
    if (error) {
      return partialFailure(`Unable to update map source details: ${error.message}`);
    }
  }

  const locationIds = new Map<string, string>();
  for (const item of plan.locationUpserts) {
    if (item.action === "update" && item.id) {
      const { data, error } = await supabase
        .from("campaign_locations")
        .update(item.values)
        .eq("campaign_id", member.campaign_id)
        .eq("id", item.id)
        .select("id")
        .maybeSingle();
      if (error) {
        return partialFailure(
          `Unable to update location "${item.sourceName}": ${error.message}`,
        );
      }
      if (!data) {
        return partialFailure(
          `Location "${item.sourceName}" changed after preview.`,
        );
      }
      locationIds.set(item.values.source_id, data.id);
    } else {
      const { data, error } = await supabase
        .from("campaign_locations")
        .insert({
          campaign_id: member.campaign_id,
          ...item.values,
        })
        .select("id")
        .single();
      if (error) {
        return partialFailure(
          `Unable to create location "${item.sourceName}": ${error.message}`,
        );
      }
      locationIds.set(item.values.source_id, data.id);
    }
  }

  const markerUpserts = plan.markerUpserts;
  for (const item of markerUpserts) {
    const { location_name: _name, location_type: _type, location_description: _description, location_source_id, ...values } =
      item.values;
    const locationId =
      values.location_id ?? locationIds.get(location_source_id) ?? null;
    if (!locationId) {
      return partialFailure(
        `Unable to resolve the campaign location for marker "${item.sourceName}".`,
      );
    }
    const row = {
      ...values,
      location_id: locationId,
      updated_at: new Date().toISOString(),
    };
    if (item.action === "update" && item.id) {
      const { data, error } = await supabase
        .from("campaign_map_markers")
        .update(row)
        .eq("campaign_id", member.campaign_id)
        .eq("map_id", mapId)
        .eq("id", item.id)
        .select("id")
        .maybeSingle();
      if (error) {
        return partialFailure(
          `Unable to update marker "${item.sourceName}": ${error.message}`,
        );
      }
      if (!data) {
        return partialFailure(
          `Marker "${item.sourceName}" changed after preview.`,
        );
      }
    } else {
      const { error } = await supabase.from("campaign_map_markers").insert({
        ...row,
        campaign_id: member.campaign_id,
        map_id: mapId,
      });
      if (error) {
        return partialFailure(
          `Unable to create marker "${item.sourceName}": ${error.message}`,
        );
      }
    }
  }

  for (const item of plan.overlayUpserts) {
    const { map_id: _mapId, ...values } = item.values;
    if (item.action === "update" && item.id) {
      const { data, error } = await supabase
        .from("campaign_map_overlays")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("campaign_id", member.campaign_id)
        .eq("map_id", mapId)
        .eq("id", item.id)
        .select("id")
        .maybeSingle();
      if (error) {
        return partialFailure(
          `Unable to update overlay "${item.sourceName}": ${error.message}`,
        );
      }
      if (!data) {
        return partialFailure(
          `Overlay "${item.sourceName}" changed after preview.`,
        );
      }
    } else {
      const { error } = await supabase.from("campaign_map_overlays").insert({
        ...values,
        campaign_id: member.campaign_id,
        map_id: mapId,
      });
      if (error) {
        return partialFailure(
          `Unable to create overlay "${item.sourceName}": ${error.message}`,
        );
      }
    }
  }

  for (const marker of plan.markerRemovals) {
    const { data, error } = await supabase
      .from("campaign_map_markers")
      .delete()
      .eq("campaign_id", member.campaign_id)
      .eq("map_id", mapId)
      .eq("id", marker.id)
      .select("id");
    if (error) {
      return partialFailure(
        `Unable to remove marker "${marker.name}": ${error.message}`,
      );
    }
    if (!data.length) {
      return partialFailure(`Marker "${marker.name}" changed after preview.`);
    }
  }

  for (const overlay of plan.overlayRemovals) {
    const { data, error } = await supabase
      .from("campaign_map_overlays")
      .delete()
      .eq("campaign_id", member.campaign_id)
      .eq("map_id", mapId)
      .eq("id", overlay.id)
      .select("id");
    if (error) {
      return partialFailure(
        `Unable to remove overlay "${overlay.name}": ${error.message}`,
      );
    }
    if (!data.length) {
      return partialFailure(`Overlay "${overlay.name}" changed after preview.`);
    }
  }

  const { error: finishError } = await supabase
    .from("campaign_atlas_sync_runs")
    .update({ status: "applied" })
    .eq("campaign_id", member.campaign_id)
    .eq("id", runId);
  if (finishError) {
    return partialFailure(
      `Synchronization completed, but its rollback record could not be finalized: ${finishError.message}`,
    );
  }

  revalidatePath("/gm/atlas");
  revalidatePath("/player/atlas");
  revalidatePath("/gm/locations");
  revalidatePath("/player/locations");

  return {
    runId,
    added: plan.changes.filter((change) => change.action === "add").length,
    updated: plan.changes.filter((change) => change.action === "update").length,
    removed: removalCount,
  };
}

export async function rollbackCampaignAtlasSync(
  runId: string,
): Promise<{ error?: string }> {
  const member = await getCurrentCampaignMember();
  if (!member || member.role !== "gm") {
    return { error: "Only the campaign GM can roll back atlas synchronization." };
  }
  if (!isUuid(runId)) {
    return { error: "Choose a valid synchronization run." };
  }
  const supabase = await createSupabaseServerClient();
  const { data: run, error: runError } = await supabase
    .from("campaign_atlas_sync_runs")
    .select(
      "id, campaign_id, map_id, source_ids, location_source_ids, before_state, status, created_at",
    )
    .eq("campaign_id", member.campaign_id)
    .eq("id", runId)
    .maybeSingle();
  if (runError) {
    return { error: `Unable to load rollback data: ${runError.message}` };
  }
  if (!run || !["applying", "applied", "partial"].includes(run.status)) {
    return { error: "This synchronization run is not available to roll back." };
  }

  const { data: latestRun, error: latestError } = await supabase
    .from("campaign_atlas_sync_runs")
    .select("id")
    .eq("campaign_id", member.campaign_id)
    .eq("map_id", run.map_id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .single();
  if (latestError) {
    return { error: `Unable to verify rollback order: ${latestError.message}` };
  }
  if (latestRun.id !== runId) {
    return {
      error:
        "A newer synchronization exists for this map. Roll back the most recent run first.",
    };
  }

  const rollback = run as unknown as SyncRun;
  const sourceIds = rollback.source_ids;
  const locationSourceIds =
    rollback.location_source_ids.length > 0
      ? rollback.location_source_ids
      : sourceIds;
  const before = rollback.before_state;
  const { error: markerDeleteError } = sourceIds.length
    ? await supabase
        .from("campaign_map_markers")
        .delete()
        .eq("campaign_id", member.campaign_id)
        .eq("map_id", run.map_id)
        .in("source_id", sourceIds)
    : { error: null };
  if (markerDeleteError) {
    return {
      error: `Unable to remove synchronized markers for rollback: ${markerDeleteError.message}`,
    };
  }
  const { error: markerRestoreError } = before.markers.length
    ? await supabase.from("campaign_map_markers").upsert(before.markers)
    : { error: null };
  if (markerRestoreError) {
    return {
      error: `Unable to restore previous markers: ${markerRestoreError.message}`,
    };
  }

  const { error: overlayDeleteError } = sourceIds.length
    ? await supabase
        .from("campaign_map_overlays")
        .delete()
        .eq("campaign_id", member.campaign_id)
        .eq("map_id", run.map_id)
        .in("source_id", sourceIds)
    : { error: null };
  if (overlayDeleteError) {
    return {
      error: `Unable to remove synchronized overlays for rollback: ${overlayDeleteError.message}`,
    };
  }
  const { error: overlayRestoreError } = before.overlays.length
    ? await supabase.from("campaign_map_overlays").upsert(before.overlays)
    : { error: null };
  if (overlayRestoreError) {
    return {
      error: `Unable to restore previous overlays: ${overlayRestoreError.message}`,
    };
  }

  const previousLocationIds = before.locations.map((location) => location.id);
  const { data: importedLocations, error: importedLocationsError } =
    locationSourceIds.length
      ? await supabase
          .from("campaign_locations")
          .select("id")
          .eq("campaign_id", member.campaign_id)
          .in("source_id", locationSourceIds)
      : { data: [], error: null };
  if (importedLocationsError) {
    return {
      error: `Unable to check synchronized locations for rollback: ${importedLocationsError.message}`,
    };
  }
  const newLocationIds = importedLocations
    .map((location: { id: string }) => location.id)
    .filter((id: string) => !previousLocationIds.includes(id));
  if (newLocationIds.length) {
    const { error } = await supabase
      .from("campaign_locations")
      .update({ source_id: null })
      .eq("campaign_id", member.campaign_id)
      .in("id", newLocationIds);
    if (error) {
      return {
        error: `Unable to detach newly synchronized locations during rollback: ${error.message}`,
      };
    }
  }
  for (const location of before.locations) {
    const { error } = await supabase
      .from("campaign_locations")
      .update({
        source_id: location.source_id,
        name: location.name,
        location_type: location.location_type,
        description: location.description,
        player_visible: location.player_visible,
      })
      .eq("campaign_id", member.campaign_id)
      .eq("id", location.id);
    if (error) {
      return {
        error: `Unable to restore location "${location.name}": ${error.message}`,
      };
    }
  }
  const { error: mapError } = await supabase
    .from("campaign_maps")
    .update({
      source_id: before.map.source_id,
      parent_map_id: before.map.parent_map_id,
      updated_at: new Date().toISOString(),
    })
    .eq("campaign_id", member.campaign_id)
    .eq("id", run.map_id);
  if (mapError) {
    return { error: `Unable to restore map hierarchy: ${mapError.message}` };
  }
  const { error: statusError } = await supabase
    .from("campaign_atlas_sync_runs")
    .update({ status: "rolled_back", rolled_back_at: new Date().toISOString() })
    .eq("campaign_id", member.campaign_id)
    .eq("id", runId);
  if (statusError) {
    return {
      error: `Atlas data was restored, but the rollback record could not be updated: ${statusError.message}`,
    };
  }

  revalidatePath("/gm/atlas");
  revalidatePath("/player/atlas");
  revalidatePath("/gm/locations");
  revalidatePath("/player/locations");
  return {};
}
