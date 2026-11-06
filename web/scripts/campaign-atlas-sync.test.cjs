const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "../src/lib/campaign-atlas-sync.ts");
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "@/lib/campaign-markers") {
    return {
      campaignMarkerTypes: [
        "city",
        "settlement",
        "fortress",
        "ruins",
        "landmark",
        "port",
        "hidden",
      ],
    };
  }
  if (request === "@/lib/campaign-map-overlays") {
    return { campaignMapOverlayTypes: ["region", "route"] };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const syncModule = new Module(sourcePath, module);
syncModule.filename = sourcePath;
syncModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
syncModule._compile(compiled.outputText, sourcePath);
Module._load = originalLoad;

const { parseAtlasSyncLayers, planAtlasSync } = syncModule.exports;
const layerPath = path.join(
  __dirname,
  "../../campaign/maps/atlas_player_layer.json",
);
const rawLayer = JSON.parse(fs.readFileSync(layerPath, "utf8"));
const parsedLayers = parseAtlasSyncLayers(rawLayer);
assert.ok(parsedLayers.sources, parsedLayers.error);
const parsedLayer = { source: parsedLayers.sources[0] };

function makeSnapshot(source = parsedLayer.source) {
  return {
    maps: [{
      id: "continent-map",
      source_id: source.map_source_id,
      parent_map_id: null,
      player_visible: true,
    }],
    markers: source.markers.map((marker, index) => ({
      id: `marker-${index}`,
      source_id: marker.source_id,
      location_id: `location-${index}`,
      name: marker.name,
      marker_type: marker.marker_type,
      x: marker.x,
      y: marker.y,
      player_visible: marker.player_visible,
    })),
    overlays: source.overlays.map((overlay, index) => ({
      id: `overlay-${index}`,
      source_id: overlay.source_id,
      name: overlay.name,
      overlay_type: overlay.overlay_type,
      points: overlay.points,
      color: overlay.color,
      player_visible: overlay.player_visible,
    })),
    locations: source.markers.map((marker, index) => ({
      id: `location-${index}`,
      source_id: marker.location_source_id,
      name: marker.name,
      location_type: marker.location_type,
      description: marker.description,
      player_visible: marker.player_visible,
      gm_notes: "Preserve these private notes.",
    })),
  };
}

test("validates the current public continental layer and stable source IDs", () => {
  assert.equal(parsedLayer.source.markers.length, 15);
  assert.equal(parsedLayer.source.overlays.length, 0);
  assert.equal(
    new Set(parsedLayer.source.markers.map((marker) => marker.source_id)).size,
    15,
  );
  assert.ok(parsedLayer.source.markers.every((marker) => marker.player_visible));
});

test("the initial continental preview contains 15 public markers and no overlays", () => {
  const plan = planAtlasSync(parsedLayer.source, "continent-map", {
    maps: [{
      id: "continent-map",
      source_id: null,
      parent_map_id: null,
      player_visible: true,
    }],
    markers: [],
    overlays: [],
    locations: [],
  });
  assert.equal(plan.markerUpserts.filter((item) => item.action === "add").length, 15);
  assert.equal(plan.locationUpserts.filter((item) => item.action === "add").length, 15);
  assert.equal(plan.overlayUpserts.length, 0);
  assert.equal(plan.markerRemovals.length, 0);
  assert.equal(plan.overlayRemovals.length, 0);
});

test("plans additions and then produces zero changes on a repeated sync", () => {
  const source = structuredClone(parsedLayer.source);
  const snapshot = makeSnapshot(source);
  source.markers.push({
    source_id: "continent_atlas/new-harbor",
    location_source_id: "continent_atlas/new-harbor",
    name: "New Harbor",
    marker_type: "port",
    x: 0.2,
    y: 0.3,
    description: "A public harbor.",
    location_type: "port",
    player_visible: true,
  });
  const addPlan = planAtlasSync(source, "continent-map", snapshot);
  assert.equal(addPlan.locationUpserts.filter((item) => item.action === "add").length, 1);
  assert.equal(addPlan.markerUpserts.filter((item) => item.action === "add").length, 1);

  snapshot.locations.push({
    id: "location-new",
    source_id: "continent_atlas/new-harbor",
    name: "New Harbor",
    location_type: "port",
    description: "A public harbor.",
    player_visible: true,
  });
  snapshot.markers.push({
    id: "marker-new",
    source_id: "continent_atlas/new-harbor",
    location_id: "location-new",
    name: "New Harbor",
    marker_type: "port",
    x: 0.2,
    y: 0.3,
    player_visible: true,
  });
  const rerun = planAtlasSync(source, "continent-map", snapshot);
  assert.equal(rerun.changes.length, 0);
});

test("updates coordinates and renames by stable source ID without replacing IDs", () => {
  const source = structuredClone(parsedLayer.source);
  const snapshot = makeSnapshot(source);
  const original = source.markers[0];
  const markerId = snapshot.markers[0].id;
  const locationId = snapshot.markers[0].location_id;
  original.name = "Tallowmere Renamed";
  original.x = 0.45;
  original.description = "Updated public description.";

  const plan = planAtlasSync(source, "continent-map", snapshot);
  const markerUpdate = plan.markerUpserts.find((item) => item.id === markerId);
  const locationUpdate = plan.locationUpserts.find(
    (item) => item.id === locationId,
  );
  assert.equal(markerUpdate.values.name, "Tallowmere Renamed");
  assert.equal(markerUpdate.values.x, 0.45);
  assert.equal(markerUpdate.values.location_id, locationId);
  assert.equal(locationUpdate.values.name, "Tallowmere Renamed");
  assert.equal(locationUpdate.values.description, "Updated public description.");
  assert.equal("gm_notes" in locationUpdate.values, false);
  assert.equal(plan.markerUpserts.filter((item) => item.action === "add").length, 0);
});

test("reuses a shared location source ID across separate map layers", () => {
  const source = structuredClone(parsedLayer.source);
  const sharedLocation = source.markers[0].location_source_id;
  const regionalSource = {
    map_source_id: "tallowmere_region",
    map_name: "Tallowmere Region",
    map_type: "region",
    parent_map_source_id: source.map_source_id,
    markers: [{
      ...source.markers[0],
      source_id: "tallowmere_region/tallowmere-city",
      location_source_id: sharedLocation,
    }],
    overlays: [],
  };
  const snapshot = makeSnapshot(source);
  snapshot.maps.push({
    id: "region-map",
    source_id: regionalSource.map_source_id,
    parent_map_id: null,
    player_visible: true,
  });
  snapshot.markers = [];
  snapshot.locations = [snapshot.locations[0]];

  const plan = planAtlasSync(regionalSource, "region-map", snapshot);
  assert.equal(plan.locationUpserts.length, 0);
  assert.equal(plan.markerUpserts.length, 1);
  assert.equal(
    plan.markerUpserts[0].values.location_id,
    snapshot.locations[0].id,
  );
  assert.equal(plan.parentMapId, "continent-map");
});

test("removes obsolete markers without planning location or lore deletion", () => {
  const source = structuredClone(parsedLayer.source);
  const snapshot = makeSnapshot(source);
  const removed = source.markers.pop();
  const plan = planAtlasSync(source, "continent-map", snapshot);

  assert.deepEqual(plan.markerRemovals.map((marker) => marker.source_id), [
    removed.source_id,
  ]);
  assert.ok(plan.changes.some((change) => change.details.join().includes("lore are preserved")));
  assert.equal(plan.locationUpserts.some((item) => item.action === "remove"), false);
  assert.ok(snapshot.locations.every((location) => location.gm_notes));
});

test("adds and removes overlays by source ID", () => {
  const source = structuredClone(parsedLayer.source);
  const snapshot = makeSnapshot(source);
  source.overlays.push({
    source_id: "continent_atlas/river-road",
    name: "River Road",
    overlay_type: "route",
    color: "#e6b45e",
    points: [{ x: 0.1, y: 0.2 }, { x: 0.5, y: 0.6 }],
    player_visible: false,
  });
  const added = planAtlasSync(source, "continent-map", snapshot);
  assert.equal(added.overlayUpserts[0].action, "add");

  snapshot.overlays.push({
    id: "overlay-road",
    source_id: "continent_atlas/river-road",
    name: "River Road",
    overlay_type: "route",
    color: "#e6b45e",
    points: [{ x: 0.1, y: 0.2 }, { x: 0.5, y: 0.6 }],
    player_visible: false,
  });
  source.overlays = [];
  const removed = planAtlasSync(source, "continent-map", snapshot);
  assert.deepEqual(removed.overlayRemovals.map((overlay) => overlay.id), [
    "overlay-road",
  ]);
});

test("preserves map hierarchy and blocks ambiguous matches", () => {
  const source = structuredClone(parsedLayer.source);
  source.parent_map_source_id = "regional-map";
  const snapshot = makeSnapshot(source);
  snapshot.maps = [
    {
      id: "continent-map",
      source_id: source.map_source_id,
      parent_map_id: null,
      player_visible: true,
    },
    {
      id: "region-map",
      source_id: "regional-map",
      parent_map_id: null,
      player_visible: true,
    },
  ];
  const plan = planAtlasSync(source, "continent-map", snapshot);
  assert.equal(plan.mapUpdate.parent_map_id, "region-map");

  snapshot.maps[1].player_visible = false;
  const visibilityConflict = planAtlasSync(source, "continent-map", snapshot);
  assert.ok(
    visibilityConflict.conflicts.some((item) =>
      item.includes("GM-only parent map"),
    ),
  );
  snapshot.maps[1].player_visible = true;
  snapshot.maps[1].parent_map_id = "continent-map";
  const cycleConflict = planAtlasSync(source, "continent-map", snapshot);
  assert.ok(cycleConflict.conflicts.some((item) => item.includes("cycle")));

  const uncertain = makeSnapshot(source);
  uncertain.markers[0].source_id = null;
  uncertain.markers.push({ ...uncertain.markers[0], id: "duplicate-marker" });
  const conflict = planAtlasSync(source, "continent-map", uncertain);
  assert.ok(conflict.conflicts.some((item) => item.includes("multiple records")));
  assert.equal(conflict.markerUpserts.length, 0);
});

test("accepts future district map layers", () => {
  const raw = structuredClone(rawLayer);
  raw.layers[0].map_type = "district";
  raw.layers[0].map_name = "Old Harbor District";
  const parsed = parseAtlasSyncLayers(raw);
  assert.equal(parsed.sources[0].map_type, "district");
});

test("rejects public visibility on hidden marker types", () => {
  const unsafe = structuredClone(rawLayer);
  unsafe.layers[0].markers[0].marker_type = "hidden";
  const parsed = parseAtlasSyncLayers(unsafe);
  assert.equal(parsed.sources, undefined);
  assert.match(parsed.error, /unsafe/);
});

test("keeps GM-only marker and location visibility private", () => {
  const source = structuredClone(parsedLayer.source);
  source.markers[0].marker_type = "hidden";
  source.markers[0].player_visible = false;
  source.markers[0].description = "A concealed site.";
  const plan = planAtlasSync(source, "continent-map", {
    maps: [{
      id: "continent-map",
      source_id: source.map_source_id,
      parent_map_id: null,
      player_visible: true,
    }],
    markers: [],
    overlays: [],
    locations: [],
  });

  assert.equal(plan.markerUpserts[0].values.player_visible, false);
  assert.equal(plan.locationUpserts[0].values.player_visible, false);
  assert.equal(
    plan.locationUpserts[0].values.description,
    "A concealed site.",
  );
  assert.equal("gm_notes" in plan.locationUpserts[0].values, false);
});
