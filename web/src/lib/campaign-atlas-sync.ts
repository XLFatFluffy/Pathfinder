import {
  campaignMarkerTypes,
  type CampaignMarkerType,
} from "@/lib/campaign-markers";
import {
  campaignMapOverlayTypes,
  type CampaignMapOverlayType,
  type CampaignMapPoint,
} from "@/lib/campaign-map-overlays";

export type AtlasSyncSourceMarker = {
  source_id: string;
  name: string;
  marker_type: CampaignMarkerType;
  x: number;
  y: number;
  description: string;
  location_type: string;
  player_visible: boolean;
};

export type AtlasSyncSourceOverlay = {
  source_id: string;
  name: string;
  overlay_type: CampaignMapOverlayType;
  color: string;
  points: CampaignMapPoint[];
  player_visible: boolean;
};

export type AtlasSyncSource = {
  map_source_id: string;
  map_name: string;
  map_type: CampaignAtlasMapType;
  parent_map_source_id: string | null;
  markers: AtlasSyncSourceMarker[];
  overlays: AtlasSyncSourceOverlay[];
};

export const campaignAtlasMapTypes = [
  "world",
  "continent",
  "region",
  "kingdom",
  "city",
  "settlement",
  "district",
  "interior",
  "dungeon",
] as const;

export type CampaignAtlasMapType = (typeof campaignAtlasMapTypes)[number];

export type AtlasSyncMap = {
  id: string;
  source_id: string | null;
  parent_map_id: string | null;
  player_visible: boolean;
};

export type AtlasSyncMarker = {
  id: string;
  source_id: string | null;
  location_id: string | null;
  name: string;
  marker_type: CampaignMarkerType;
  x: number;
  y: number;
  player_visible: boolean;
};

export type AtlasSyncOverlay = {
  id: string;
  source_id: string | null;
  name: string;
  overlay_type: CampaignMapOverlayType;
  points: CampaignMapPoint[];
  color: string;
  player_visible: boolean;
};

export type AtlasSyncLocation = {
  id: string;
  source_id: string | null;
  name: string;
  location_type: string;
  description: string;
  player_visible: boolean;
};

export type AtlasSyncSnapshot = {
  maps: AtlasSyncMap[];
  markers: AtlasSyncMarker[];
  overlays: AtlasSyncOverlay[];
  locations: AtlasSyncLocation[];
};

export type AtlasSyncMarkerValues = Omit<AtlasSyncMarker, "id" | "source_id"> & {
  source_id: string;
  map_id: string;
  location_source_id: string;
  location_name: string;
  location_type: string;
  location_description: string;
};

export type AtlasSyncOverlayValues = Omit<AtlasSyncOverlay, "id" | "source_id"> & {
  source_id: string;
  map_id: string;
};

export type AtlasSyncLocationValues = Omit<
  AtlasSyncLocation,
  "id" | "source_id"
> & {
  source_id: string;
};

export type AtlasSyncPlan = {
  mapId: string;
  mapSourceId: string;
  parentMapId: string | null;
  mapUpdate: {
    source_id: string;
    parent_map_id: string | null;
  } | null;
  locationUpserts: Array<{
    action: "add" | "update";
    id?: string;
    values: AtlasSyncLocationValues;
    sourceName: string;
  }>;
  markerUpserts: Array<{
    action: "add" | "update";
    id?: string;
    values: AtlasSyncMarkerValues;
    sourceName: string;
  }>;
  overlayUpserts: Array<{
    action: "add" | "update";
    id?: string;
    values: AtlasSyncOverlayValues;
    sourceName: string;
  }>;
  markerRemovals: Array<{ id: string; source_id: string; name: string }>;
  overlayRemovals: Array<{ id: string; source_id: string; name: string }>;
  conflicts: string[];
  warnings: string[];
  changes: Array<{
    action: "add" | "update" | "remove";
    kind: "map" | "location" | "marker" | "overlay";
    name: string;
    details: string[];
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isSourceId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 160 &&
    /^[a-z0-9][a-z0-9/_-]*$/i.test(value)
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

function isMapType(value: unknown): value is CampaignAtlasMapType {
  return (
    typeof value === "string" &&
    campaignAtlasMapTypes.some((type) => type === value)
  );
}

export function parseAtlasSyncSource(raw: unknown): {
  source?: AtlasSyncSource;
  error?: string;
} {
  if (
    !isRecord(raw) ||
    raw.map !== raw.map_source_id ||
    !isSourceId(raw.map_source_id) ||
    typeof raw.map_name !== "string" ||
    !raw.map_name.trim() ||
    raw.map_name.trim().length > 160 ||
    !isMapType(raw.map_type) ||
    (raw.parent_map_source_id !== null &&
      !isSourceId(raw.parent_map_source_id)) ||
    !Array.isArray(raw.markers) ||
    !Array.isArray(raw.overlays) ||
    raw.markers.length > 1000 ||
    raw.overlays.length > 100
  ) {
    return { error: "The repository atlas layer has invalid map or layer fields." };
  }

  const markerIds = new Set<string>();
  const markers: AtlasSyncSourceMarker[] = [];
  for (const rawMarker of raw.markers) {
    if (
      !isRecord(rawMarker) ||
      !isSourceId(rawMarker.source_id) ||
      markerIds.has(rawMarker.source_id) ||
      typeof rawMarker.name !== "string" ||
      !rawMarker.name.trim() ||
      rawMarker.name.trim().length > 160 ||
      !isMarkerType(rawMarker.marker_type) ||
      typeof rawMarker.x !== "number" ||
      !Number.isFinite(rawMarker.x) ||
      rawMarker.x < 0 ||
      rawMarker.x > 1 ||
      typeof rawMarker.y !== "number" ||
      !Number.isFinite(rawMarker.y) ||
      rawMarker.y < 0 ||
      rawMarker.y > 1 ||
      typeof rawMarker.description !== "string" ||
      rawMarker.description.length > 20000 ||
      typeof rawMarker.location_type !== "string" ||
      rawMarker.location_type.length > 80 ||
      typeof rawMarker.player_visible !== "boolean" ||
      (rawMarker.marker_type === "hidden" && rawMarker.player_visible)
    ) {
      return {
        error: "A repository marker has invalid, unsafe, or duplicate source data.",
      };
    }
    markerIds.add(rawMarker.source_id);
    markers.push({
      source_id: rawMarker.source_id,
      name: rawMarker.name.trim(),
      marker_type: rawMarker.marker_type,
      x: rawMarker.x,
      y: rawMarker.y,
      description: rawMarker.description,
      location_type: rawMarker.location_type.trim(),
      player_visible: rawMarker.player_visible,
    });
  }

  const overlayIds = new Set<string>();
  const overlays: AtlasSyncSourceOverlay[] = [];
  for (const rawOverlay of raw.overlays) {
    if (
      !isRecord(rawOverlay) ||
      !isSourceId(rawOverlay.source_id) ||
      overlayIds.has(rawOverlay.source_id) ||
      typeof rawOverlay.name !== "string" ||
      !rawOverlay.name.trim() ||
      rawOverlay.name.trim().length > 160 ||
      !isOverlayType(rawOverlay.overlay_type) ||
      typeof rawOverlay.color !== "string" ||
      !/^#[0-9a-f]{6}$/i.test(rawOverlay.color) ||
      !Array.isArray(rawOverlay.points) ||
      rawOverlay.points.length <
        (rawOverlay.overlay_type === "region" ? 3 : 2) ||
      rawOverlay.points.length > 1000 ||
      !rawOverlay.points.every(isPoint) ||
      typeof rawOverlay.player_visible !== "boolean"
    ) {
      return {
        error: "A repository overlay has invalid, unsafe, or duplicate source data.",
      };
    }
    overlayIds.add(rawOverlay.source_id);
    overlays.push({
      source_id: rawOverlay.source_id,
      name: rawOverlay.name.trim(),
      overlay_type: rawOverlay.overlay_type,
      color: rawOverlay.color.toLowerCase(),
      points: rawOverlay.points,
      player_visible: rawOverlay.player_visible,
    });
  }

  return {
    source: {
      map_source_id: raw.map_source_id,
      map_name: raw.map_name.trim(),
      map_type: raw.map_type,
      parent_map_source_id: raw.parent_map_source_id,
      markers,
      overlays,
    },
  };
}

export function parseAtlasSyncLayers(raw: unknown): {
  sources?: AtlasSyncSource[];
  error?: string;
} {
  if (!isRecord(raw)) {
    return { error: "The repository atlas layer manifest is invalid." };
  }
  const layers = raw.layers;
  if (
    !Array.isArray(layers) ||
    layers.length < 1 ||
    layers.length > 100
  ) {
    return { error: "The repository manifest must contain 1 to 100 map layers." };
  }
  const sources: AtlasSyncSource[] = [];
  const sourceIds = new Set<string>();
  const recordSourceIds = new Set<string>();
  for (const layer of layers) {
    const parsed = parseAtlasSyncSource(layer);
    if (!parsed.source) {
      return parsed;
    }
    if (sourceIds.has(parsed.source.map_source_id)) {
      return {
        error: `Map source "${parsed.source.map_source_id}" is listed more than once.`,
      };
    }
    sourceIds.add(parsed.source.map_source_id);
    for (const recordId of [
      ...parsed.source.markers.map((marker) => marker.source_id),
      ...parsed.source.overlays.map((overlay) => overlay.source_id),
    ]) {
      if (recordSourceIds.has(recordId)) {
        return {
          error: `Repository source "${recordId}" is used by more than one map feature.`,
        };
      }
      recordSourceIds.add(recordId);
    }
    sources.push(parsed.source);
  }
  return { sources };
}

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase();
}

function changedFields(
  existing: Record<string, unknown>,
  desired: Record<string, unknown>,
  fields: string[],
) {
  return fields.filter(
    (field) =>
      JSON.stringify(existing[field]) !== JSON.stringify(desired[field]),
  );
}

export function planAtlasSync(
  source: AtlasSyncSource,
  mapId: string,
  snapshot: AtlasSyncSnapshot,
): AtlasSyncPlan {
  const plan: AtlasSyncPlan = {
    mapId,
    mapSourceId: source.map_source_id,
    parentMapId: null,
    mapUpdate: null,
    locationUpserts: [],
    markerUpserts: [],
    overlayUpserts: [],
    markerRemovals: [],
    overlayRemovals: [],
    conflicts: [],
    warnings: [],
    changes: [],
  };
  const mapsWithSourceId = snapshot.maps.filter(
    (map) => map.source_id === source.map_source_id,
  );
  const targetMap = snapshot.maps.find((map) => map.id === mapId);
  if (!targetMap) {
    plan.conflicts.push("The selected campaign map was not found.");
    return plan;
  }
  if (
    (targetMap.source_id && targetMap.source_id !== source.map_source_id) ||
    mapsWithSourceId.some((map) => map.id !== mapId)
  ) {
    plan.conflicts.push(
      `Map "${mapId}" is already associated with a different repository source.`,
    );
    return plan;
  }

  let parentMapId: string | null = null;
  if (source.parent_map_source_id) {
    const parents = snapshot.maps.filter(
      (map) => map.source_id === source.parent_map_source_id,
    );
    if (parents.length !== 1 || parents[0]?.id === mapId) {
      plan.conflicts.push(
        `Parent map source "${source.parent_map_source_id}" does not resolve uniquely.`,
      );
    } else {
      parentMapId = parents[0].id;
      if (targetMap.player_visible && !parents[0].player_visible) {
        plan.conflicts.push(
          `Player-visible map "${source.map_name}" cannot be attached to a GM-only parent map.`,
        );
      }
      const visited = new Set<string>();
      let ancestorId: string | null = parentMapId;
      while (ancestorId && !visited.has(ancestorId)) {
        if (ancestorId === mapId) {
          plan.conflicts.push(
            `Parent source "${source.parent_map_source_id}" would create a map hierarchy cycle.`,
          );
          break;
        }
        visited.add(ancestorId);
        ancestorId =
          snapshot.maps.find((map) => map.id === ancestorId)?.parent_map_id ??
          null;
      }
    }
  }
  plan.parentMapId = parentMapId;
  const desiredMap = {
    source_id: source.map_source_id,
    parent_map_id: parentMapId,
  };
  if (
    targetMap.source_id !== desiredMap.source_id ||
    targetMap.parent_map_id !== desiredMap.parent_map_id
  ) {
    plan.mapUpdate = desiredMap;
    plan.changes.push({
      action: "update",
      kind: "map",
      name: source.map_source_id,
      details: changedFields(
        targetMap as unknown as Record<string, unknown>,
        desiredMap,
        ["source_id", "parent_map_id"],
      ),
    });
  }

  const claimedMarkerIds = new Set<string>();
  const claimedLocationIds = new Set<string>();
  const sourceMarkerIds = new Set(source.markers.map((item) => item.source_id));
  for (const marker of source.markers) {
    const sameSource = snapshot.markers.filter(
      (item) => item.source_id === marker.source_id,
    );
    if (sameSource.length > 1) {
      plan.conflicts.push(
        `Marker source "${marker.source_id}" matches multiple database records.`,
      );
      continue;
    }
    let existingMarker = sameSource[0];
    if (!existingMarker) {
      const sameName = snapshot.markers.filter(
        (item) => normalizeName(item.name) === normalizeName(marker.name),
      );
      const legacyMatches = sameName.filter((item) => !item.source_id);
      if (legacyMatches.length > 1) {
        plan.conflicts.push(
          `Marker "${marker.name}" matches multiple records without source IDs.`,
        );
        continue;
      }
      if (legacyMatches.length === 1) {
        existingMarker = legacyMatches[0];
        plan.warnings.push(
          `Marker "${marker.name}" will adopt the existing marker by unique name.`,
        );
      } else if (sameName.length) {
        plan.conflicts.push(
          `Marker "${marker.name}" has the same name as a marker owned by another source.`,
        );
        continue;
      }
    }
    if (existingMarker && claimedMarkerIds.has(existingMarker.id)) {
      plan.conflicts.push(
        `More than one repository marker resolves to "${existingMarker.name}".`,
      );
      continue;
    }

    const linkedLocation = existingMarker?.location_id
      ? snapshot.locations.find(
          (location) => location.id === existingMarker.location_id,
        )
      : undefined;
    const sourceLocations = snapshot.locations.filter(
      (location) => location.source_id === marker.source_id,
    );
    if (sourceLocations.length > 1) {
      plan.conflicts.push(
        `Location source "${marker.source_id}" matches multiple database records.`,
      );
      continue;
    }
    const sameNameLocations = snapshot.locations.filter(
      (location) => normalizeName(location.name) === normalizeName(marker.name),
    );
    const legacyLocations = sameNameLocations.filter(
      (location) => !location.source_id,
    );
    if (legacyLocations.length > 1 && !linkedLocation) {
      plan.conflicts.push(
        `Location "${marker.name}" matches multiple records without source IDs.`,
      );
      continue;
    }
    const matchedLocation =
      linkedLocation ??
      sourceLocations[0] ??
      (legacyLocations.length === 1 ? legacyLocations[0] : undefined);
    if (
      linkedLocation &&
      sourceLocations[0] &&
      sourceLocations[0].id !== linkedLocation.id
    ) {
      plan.conflicts.push(
        `Marker "${marker.name}" is linked to a different location than its repository source.`,
      );
      continue;
    }
    if (
      !linkedLocation &&
      !sourceLocations[0] &&
      sameNameLocations.some((location) => location.source_id)
    ) {
      plan.conflicts.push(
        `Location "${marker.name}" has the same name as a location owned by another source.`,
      );
      continue;
    }
    if (matchedLocation && claimedLocationIds.has(matchedLocation.id)) {
      plan.conflicts.push(
        `More than one repository marker resolves to location "${matchedLocation.name}".`,
      );
      continue;
    }

    const locationValues: AtlasSyncLocationValues = {
      source_id: marker.source_id,
      name: marker.name,
      location_type: marker.location_type,
      description: marker.description,
      player_visible: marker.player_visible,
    };
    const locationFields = [
      "source_id",
      "name",
      "location_type",
      "description",
      "player_visible",
    ];
    let locationId: string;
    if (matchedLocation) {
      locationId = matchedLocation.id;
      claimedLocationIds.add(locationId);
      const fields = changedFields(
        matchedLocation as unknown as Record<string, unknown>,
        locationValues,
        locationFields,
      );
      if (fields.length) {
        plan.locationUpserts.push({
          action: "update",
          id: locationId,
          values: locationValues,
          sourceName: marker.name,
        });
        plan.changes.push({
          action: "update",
          kind: "location",
          name: marker.name,
          details: fields,
        });
      }
    } else {
      locationId = "";
      plan.locationUpserts.push({
        action: "add",
        values: locationValues,
        sourceName: marker.name,
      });
      plan.changes.push({
        action: "add",
        kind: "location",
        name: marker.name,
        details: ["location record"],
      });
    }

    const markerValues: AtlasSyncMarkerValues = {
      map_id: mapId,
      source_id: marker.source_id,
      location_id: locationId || matchedLocation?.id || null,
      location_source_id: marker.source_id,
      location_name: marker.name,
      location_type: marker.location_type,
      location_description: marker.description,
      name: marker.name,
      marker_type: marker.marker_type,
      x: marker.x,
      y: marker.y,
      player_visible: marker.player_visible,
    };
    const markerFields = [
      "source_id",
      "location_id",
      "name",
      "marker_type",
      "x",
      "y",
      "player_visible",
    ];
    if (existingMarker) {
      claimedMarkerIds.add(existingMarker.id);
      const fields = changedFields(
        existingMarker as unknown as Record<string, unknown>,
        markerValues,
        markerFields,
      );
      if (fields.length) {
        plan.markerUpserts.push({
          action: "update",
          id: existingMarker.id,
          values: markerValues,
          sourceName: marker.name,
        });
        plan.changes.push({
          action: "update",
          kind: "marker",
          name: marker.name,
          details: fields,
        });
      }
    } else {
      plan.markerUpserts.push({
        action: "add",
        values: markerValues,
        sourceName: marker.name,
      });
      plan.changes.push({
        action: "add",
        kind: "marker",
        name: marker.name,
        details: ["map marker"],
      });
    }
  }

  const sourceOverlayIds = new Set(
    source.overlays.map((item) => item.source_id),
  );
  for (const overlay of source.overlays) {
    const matches = snapshot.overlays.filter(
      (item) => item.source_id === overlay.source_id,
    );
    if (matches.length > 1) {
      plan.conflicts.push(
        `Overlay source "${overlay.source_id}" matches multiple database records.`,
      );
      continue;
    }
    const sameName = snapshot.overlays.filter(
      (item) => normalizeName(item.name) === normalizeName(overlay.name),
    );
    let existingOverlay = matches[0];
    if (!existingOverlay && sameName.length) {
      const legacy = sameName.filter((item) => !item.source_id);
      if (legacy.length === 1) {
        existingOverlay = legacy[0];
        plan.warnings.push(
          `Overlay "${overlay.name}" will adopt the existing overlay by unique name.`,
        );
      } else {
        plan.conflicts.push(
          `Overlay "${overlay.name}" cannot be matched confidently to the existing records.`,
        );
        continue;
      }
    }
    const values: AtlasSyncOverlayValues = {
      map_id: mapId,
      source_id: overlay.source_id,
      name: overlay.name,
      overlay_type: overlay.overlay_type,
      points: overlay.points,
      color: overlay.color,
      player_visible: overlay.player_visible,
    };
    const fields = [
      "source_id",
      "name",
      "overlay_type",
      "points",
      "color",
      "player_visible",
    ];
    if (existingOverlay) {
      const changes = changedFields(
        existingOverlay as unknown as Record<string, unknown>,
        values,
        fields,
      );
      if (changes.length) {
        plan.overlayUpserts.push({
          action: "update",
          id: existingOverlay.id,
          values,
          sourceName: overlay.name,
        });
        plan.changes.push({
          action: "update",
          kind: "overlay",
          name: overlay.name,
          details: changes,
        });
      }
    } else {
      plan.overlayUpserts.push({
        action: "add",
        values,
        sourceName: overlay.name,
      });
      plan.changes.push({
        action: "add",
        kind: "overlay",
        name: overlay.name,
        details: ["map overlay"],
      });
    }
  }

  for (const marker of snapshot.markers) {
    if (marker.source_id && !sourceMarkerIds.has(marker.source_id)) {
      plan.markerRemovals.push({
        id: marker.id,
        source_id: marker.source_id,
        name: marker.name,
      });
      if (marker.location_id) {
        plan.warnings.push(
          `Removing marker "${marker.name}" preserves its linked campaign location and any dependent maps, lore, and notes for GM review.`,
        );
      }
      plan.changes.push({
        action: "remove",
        kind: "marker",
        name: marker.name,
        details: ["map marker only; campaign location and lore are preserved"],
      });
    }
  }
  for (const overlay of snapshot.overlays) {
    if (overlay.source_id && !sourceOverlayIds.has(overlay.source_id)) {
      plan.overlayRemovals.push({
        id: overlay.id,
        source_id: overlay.source_id,
        name: overlay.name,
      });
      plan.changes.push({
        action: "remove",
        kind: "overlay",
        name: overlay.name,
        details: ["map overlay"],
      });
    }
  }

  if (plan.conflicts.length) {
    plan.locationUpserts = [];
    plan.markerUpserts = [];
    plan.overlayUpserts = [];
    plan.markerRemovals = [];
    plan.overlayRemovals = [];
    plan.mapUpdate = null;
    plan.changes = [];
  }
  return plan;
}
