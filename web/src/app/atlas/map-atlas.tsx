"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  deleteCampaignMapMarker,
  getCampaignMapArtworkUrl,
  getCampaignMapMarkers,
  saveCampaignMapMarker,
} from "./actions";
import type {
  CampaignAtlasLocation,
  CampaignAtlasMap,
} from "@/lib/campaign-atlas";
import {
  campaignMarkerTypes,
  type CampaignMapMarker,
  type CampaignMarkerType,
} from "@/lib/campaign-markers";

const minimumZoom = 0.005;
const maximumZoom = 8;
const markerSymbols: Record<CampaignMarkerType, string> = {
  city: "✦",
  settlement: "⌂",
  fortress: "♜",
  ruins: "◇",
  landmark: "⌁",
  port: "⚓",
  hidden: "!",
};

type View = {
  scale: number;
  x: number;
  y: number;
};

function clampZoom(scale: number) {
  return Math.min(maximumZoom, Math.max(minimumZoom, scale));
}

function isCampaignMarkerType(value: string): value is CampaignMarkerType {
  return campaignMarkerTypes.some((type) => type === value);
}

function mapHierarchyLabel(
  map: CampaignAtlasMap,
  mapsById: Map<string, CampaignAtlasMap>,
) {
  const hierarchy: string[] = [];
  const visited = new Set<string>();
  let current: CampaignAtlasMap | undefined = map;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    hierarchy.unshift(current.name);
    current = current.parent_map_id
      ? mapsById.get(current.parent_map_id)
      : undefined;
  }

  return hierarchy.join(" / ");
}

export default function MapAtlas({
  maps,
  locations,
  mapLibraryHref,
  canEditMarkers = false,
}: {
  maps: CampaignAtlasMap[];
  locations: CampaignAtlasLocation[];
  mapLibraryHref: string;
  canEditMarkers?: boolean;
}) {
  const availableMaps = maps.filter((map) => map.has_artwork);
  const mapsById = new Map(maps.map((map) => [map.id, map]));
  const initialMap =
    maps.find((map) => !map.parent_map_id && map.has_artwork) ??
    availableMaps[0];
  const [selectedId, setSelectedId] = useState(initialMap?.id ?? "");
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [markers, setMarkers] = useState<CampaignMapMarker[]>([]);
  const [markersStatus, setMarkersStatus] = useState("");
  const [selectedMarkerId, setSelectedMarkerId] = useState("");
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number }>();
  const [isPlacingMarker, setIsPlacingMarker] = useState(false);
  const [markerName, setMarkerName] = useState("");
  const [markerType, setMarkerType] = useState<CampaignMarkerType>("landmark");
  const [markerLocationId, setMarkerLocationId] = useState("");
  const [markerPlayerVisible, setMarkerPlayerVisible] = useState(false);
  const [markerPending, setMarkerPending] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const loadSequence = useRef(0);
  const dragged = useRef(false);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const selectedMap = mapsById.get(selectedId);
  const selectedMarker = markers.find((marker) => marker.id === selectedMarkerId);

  function chooseMarkerType(value: string) {
    if (isCampaignMarkerType(value)) {
      setMarkerType(value);
    }
  }

  const refreshMarkers = useCallback(async () => {
    if (!selectedId) {
      setMarkers([]);
      setMarkersStatus("");
      return;
    }

    setMarkers([]);
    setMarkersStatus("Loading markers…");
    try {
      const result = await getCampaignMapMarkers(selectedId);
      if (result.error || !result.markers) {
        setMarkers([]);
        setMarkersStatus(result.error ?? "Unable to load map markers.");
        return;
      }
      setMarkers(result.markers);
      setMarkersStatus("");
    } catch (error) {
      setMarkers([]);
      setMarkersStatus(
        error instanceof Error
          ? `Unable to load map markers: ${error.message}`
          : "Unable to load map markers.",
      );
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setArtworkUrl(null);
      setStatus("Add a map with artwork in the map library to explore the atlas.");
      return;
    }

    let active = true;
    const sequence = ++loadSequence.current;
    setArtworkUrl(null);
    setNaturalSize({ width: 0, height: 0 });
    setView({ scale: 1, x: 0, y: 0 });
    setStatus("Loading map artwork…");

    void getCampaignMapArtworkUrl(selectedId)
      .then((result) => {
        if (!active || sequence !== loadSequence.current) {
          return;
        }
        if (result.error || !result.url) {
          setStatus(result.error ?? "Map artwork is unavailable.");
          return;
        }
        setArtworkUrl(result.url);
        setStatus("");
      })
      .catch((error: unknown) => {
        if (!active || sequence !== loadSequence.current) {
          return;
        }
        setStatus(
          error instanceof Error
            ? `Unable to open map artwork: ${error.message}`
            : "Unable to open map artwork.",
        );
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  useEffect(() => {
    setSelectedMarkerId("");
    setPendingPoint(undefined);
    setIsPlacingMarker(false);
    void refreshMarkers();
  }, [refreshMarkers]);

  useEffect(() => {
    if (!selectedMarker) {
      return;
    }
    setMarkerName(selectedMarker.name);
    setMarkerType(selectedMarker.marker_type);
    setMarkerLocationId(selectedMarker.location_id ?? "");
    setMarkerPlayerVisible(selectedMarker.player_visible);
  }, [selectedMarker]);

  const fitMap = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !naturalSize.width || !naturalSize.height) {
      return;
    }
    const padding = 40;
    const scale = clampZoom(
      Math.min(
        (viewport.clientWidth - padding) / naturalSize.width,
        (viewport.clientHeight - padding) / naturalSize.height,
      ),
    );
    setView({ scale, x: 0, y: 0 });
  }, [naturalSize]);

  useEffect(() => {
    if (naturalSize.width) {
      fitMap();
    }
  }, [fitMap, naturalSize.width]);

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const viewport = viewportRef.current;
      if (!viewport || !naturalSize.width) {
        return;
      }
      const bounds = viewport.getBoundingClientRect();
      const anchorX =
        clientX === undefined ? bounds.width / 2 : clientX - bounds.left;
      const anchorY =
        clientY === undefined ? bounds.height / 2 : clientY - bounds.top;

      setView((current) => {
        const scale = clampZoom(current.scale * factor);
        const imageX = (anchorX - bounds.width / 2 - current.x) / current.scale;
        const imageY = (anchorY - bounds.height / 2 - current.y) / current.scale;
        return {
          scale,
          x: anchorX - bounds.width / 2 - imageX * scale,
          y: anchorY - bounds.height / 2 - imageY * scale,
        };
      });
    },
    [naturalSize.width],
  );

  useEffect(() => {
    if (!naturalSize.width) {
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => fitMap());
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fitMap, naturalSize.width]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    dragged.current = false;
    if (!artworkUrl || isPlacingMarker) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: view.x,
      originY: view.y,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const currentDrag = drag.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
      return;
    }
    if (
      Math.abs(event.clientX - currentDrag.startX) > 3 ||
      Math.abs(event.clientY - currentDrag.startY) > 3
    ) {
      dragged.current = true;
    }
    setView((current) => ({
      ...current,
      x: currentDrag.originX + event.clientX - currentDrag.startX,
      y: currentDrag.originY + event.clientY - currentDrag.startY,
    }));
  }

  function handleViewportClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!canEditMarkers || !isPlacingMarker || dragged.current || !naturalSize.width) {
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const bounds = viewport.getBoundingClientRect();
    const x =
      (event.clientX - bounds.left - bounds.width / 2 - view.x) /
        (naturalSize.width * view.scale) +
      0.5;
    const y =
      (event.clientY - bounds.top - bounds.height / 2 - view.y) /
        (naturalSize.height * view.scale) +
      0.5;
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      setMarkersStatus("Place the marker inside the map artwork.");
      return;
    }
    setPendingPoint({ x, y });
    if (!selectedMarker) {
      setSelectedMarkerId("");
      setMarkerName("");
      setMarkerType("landmark");
      setMarkerLocationId("");
      setMarkerPlayerVisible(false);
    }
    setIsPlacingMarker(false);
    setMarkersStatus("Set the marker details, then save it.");
  }

  async function submitMarker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const point = pendingPoint ?? selectedMarker;
    if (!point || !selectedId) {
      setMarkersStatus("Choose a map location for the marker first.");
      return;
    }

    setMarkerPending(true);
    setMarkersStatus("");
    try {
      const result = await saveCampaignMapMarker({
        ...(selectedMarker ? { id: selectedMarker.id } : {}),
        mapId: selectedId,
        locationId: markerLocationId,
        name: markerName,
        markerType,
        x: point.x,
        y: point.y,
        playerVisible: markerPlayerVisible,
      });
      if (result.error) {
        setMarkersStatus(result.error);
        return;
      }
      setPendingPoint(undefined);
      setSelectedMarkerId(result.id ?? "");
      await refreshMarkers();
      setMarkersStatus("Map marker saved.");
    } catch (error) {
      setMarkersStatus(
        error instanceof Error
          ? `Unable to save map marker: ${error.message}`
          : "Unable to save map marker.",
      );
    } finally {
      setMarkerPending(false);
    }
  }

  async function removeSelectedMarker() {
    if (!selectedMarker) {
      return;
    }
    setMarkerPending(true);
    setMarkersStatus("");
    try {
      const result = await deleteCampaignMapMarker(selectedMarker.id);
      if (result.error) {
        setMarkersStatus(result.error);
        return;
      }
      setSelectedMarkerId("");
      setMarkersStatus("Map marker deleted.");
      await refreshMarkers();
    } catch (error) {
      setMarkersStatus(
        error instanceof Error
          ? `Unable to delete map marker: ${error.message}`
          : "Unable to delete map marker.",
      );
    } finally {
      setMarkerPending(false);
    }
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!artworkUrl) {
      return;
    }
    event.preventDefault();
    zoomAt(event.deltaY < 0 ? 1.15 : 1 / 1.15, event.clientX, event.clientY);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomAt(1.2);
    } else if (event.key === "-") {
      event.preventDefault();
      zoomAt(1 / 1.2);
    } else if (event.key === "0" || event.key === "Home") {
      event.preventDefault();
      fitMap();
    } else if (event.key.startsWith("Arrow")) {
      event.preventDefault();
      const distance = event.shiftKey ? 100 : 40;
      setView((current) => ({
        ...current,
        x: current.x + (event.key === "ArrowLeft" ? distance : event.key === "ArrowRight" ? -distance : 0),
        y: current.y + (event.key === "ArrowUp" ? distance : event.key === "ArrowDown" ? -distance : 0),
      }));
    }
  }

  const parentMaps: CampaignAtlasMap[] = [];
  const visitedParents = new Set<string>();
  let parent = selectedMap?.parent_map_id
    ? mapsById.get(selectedMap.parent_map_id)
    : undefined;
  while (parent && !visitedParents.has(parent.id)) {
    visitedParents.add(parent.id);
    parentMaps.unshift(parent);
    parent = parent.parent_map_id
      ? mapsById.get(parent.parent_map_id)
      : undefined;
  }
  const childMaps = selectedMap
    ? maps.filter(
        (map) => map.parent_map_id === selectedMap.id && map.has_artwork,
      )
    : [];

  return (
    <section className="atlas-viewer" aria-label="Interactive campaign atlas">
      <div className="atlas-toolbar">
        <label htmlFor="atlas-map-picker">Map</label>
        <select
          id="atlas-map-picker"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          disabled={!availableMaps.length}
        >
          {!availableMaps.length ? <option value="">No maps available</option> : null}
          {availableMaps.map((map) => (
            <option key={map.id} value={map.id}>
              {mapHierarchyLabel(map, mapsById)} ({map.map_type})
            </option>
          ))}
        </select>
        <button
          aria-label="Zoom out"
          disabled={!artworkUrl}
          onClick={() => zoomAt(1 / 1.2)}
          type="button"
        >
          −
        </button>
        <button
          aria-label="Zoom in"
          disabled={!artworkUrl}
          onClick={() => zoomAt(1.2)}
          type="button"
        >
          +
        </button>
        <button disabled={!artworkUrl} onClick={fitMap} type="button">
          Fit map
        </button>
        <a className="button-link" href={mapLibraryHref}>
          Manage maps
        </a>
        {canEditMarkers ? (
          <button
            disabled={!artworkUrl}
            onClick={() => {
              setPendingPoint(undefined);
              setSelectedMarkerId("");
              setIsPlacingMarker((current) => !current);
              setMarkersStatus(
                isPlacingMarker
                  ? "Marker placement cancelled."
                  : "Click inside the map artwork to place a marker.",
              );
            }}
            type="button"
          >
            {isPlacingMarker ? "Cancel marker" : "Place marker"}
          </button>
        ) : null}
        <output className="atlas-zoom" aria-label="Current zoom">
          {Math.round(view.scale * 100)}%
        </output>
      </div>

      <nav className="atlas-breadcrumbs" aria-label="Map hierarchy">
        {parentMaps.map((map) => (
          map.has_artwork ? (
            <button
              key={map.id}
              onClick={() => setSelectedId(map.id)}
              type="button"
            >
              {map.name}
            </button>
          ) : (
            <span key={map.id}>{map.name}</span>
          )
        ))}
        {selectedMap ? (
          <span aria-current="location">{selectedMap.name}</span>
        ) : null}
      </nav>

      {childMaps.length ? (
        <nav className="atlas-child-maps" aria-label="Maps within this map">
          <span>Explore within:</span>
          {childMaps.map((map) => (
            <button key={map.id} onClick={() => setSelectedId(map.id)} type="button">
              {map.name}
            </button>
          ))}
        </nav>
      ) : null}

      <div
        aria-label="Interactive map. Drag to pan, use the mouse wheel to zoom, or use arrow, plus, minus, and home keys."
        aria-roledescription="interactive map"
        className={`atlas-viewport${artworkUrl ? " is-ready" : ""}`}
        onClick={handleViewportClick}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onWheel={handleWheel}
        ref={viewportRef}
        role="application"
        tabIndex={0}
      >
        {artworkUrl ? (
          <div
            className="atlas-image-layer"
            style={{
              left: `calc(50% + ${view.x}px)`,
              top: `calc(50% + ${view.y}px)`,
              transform: `translate(-50%, -50%) scale(${view.scale})`,
              width: naturalSize.width || undefined,
              height: naturalSize.height || undefined,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={selectedMap ? `Map of ${selectedMap.name}` : "Campaign map"}
              className="atlas-artwork"
              draggable={false}
              onError={() => setStatus("The map image could not be loaded.")}
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                if (!naturalWidth || !naturalHeight) {
                  setStatus("The map image has invalid dimensions.");
                  return;
                }
                setNaturalSize({ width: naturalWidth, height: naturalHeight });
                setStatus("");
              }}
              src={artworkUrl}
            />
            {markers.map((marker) => (
              <button
                aria-label={`${marker.name}${marker.location_name ? `, ${marker.location_name}` : ""}`}
                className={`atlas-marker atlas-marker-${marker.marker_type}${selectedMarkerId === marker.id ? " is-selected" : ""}`}
                key={marker.id}
                onClick={(event) => {
                  event.stopPropagation();
                  setPendingPoint(undefined);
                  setIsPlacingMarker(false);
                  setSelectedMarkerId(marker.id);
                }}
                style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
                title={marker.name}
                type="button"
              >
                {markerSymbols[marker.marker_type]}
              </button>
            ))}
            {pendingPoint ? (
              <span
                aria-label="New marker position"
                className="atlas-marker atlas-marker-pending"
                style={{
                  left: `${pendingPoint.x * 100}%`,
                  top: `${pendingPoint.y * 100}%`,
                }}
              >
                +
              </span>
            ) : null}
          </div>
        ) : null}
        {status ? (
          <p className="atlas-map-message" role="status" aria-live="polite">
            {status}
          </p>
        ) : null}
      </div>

      <p className="muted atlas-help">
        Drag to pan. Scroll to zoom at the pointer. Keyboard: arrow keys to pan,
        +/− to zoom, Home or 0 to fit the map.
      </p>
      {canEditMarkers || markers.length || markersStatus ? (
        <section className="atlas-marker-panel" aria-labelledby="atlas-markers-heading">
          <h3 id="atlas-markers-heading">Map markers</h3>
          {canEditMarkers ? (
            <p className="muted">
              Markers use proportional artwork coordinates and stay aligned if
              you replace the image.
            </p>
          ) : null}
          {markers.length ? (
            <ul className="atlas-marker-list">
              {markers.map((marker) => (
                <li key={marker.id}>
                  <button
                    aria-pressed={selectedMarkerId === marker.id}
                    onClick={() => {
                      setPendingPoint(undefined);
                      setSelectedMarkerId(marker.id);
                    }}
                    type="button"
                  >
                    {markerSymbols[marker.marker_type]} {marker.name}
                    {marker.location_name ? ` · ${marker.location_name}` : ""}
                  </button>
                  {canEditMarkers ? (
                    <span className="muted">
                      {marker.player_visible ? "Shared" : "GM-only"}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              {markersStatus || "No markers have been added to this map."}
            </p>
          )}
          {canEditMarkers && (selectedMarker || pendingPoint) ? (
            <form className="atlas-marker-form" onSubmit={submitMarker}>
              <h4>{selectedMarker ? "Edit marker" : "New marker"}</h4>
              <label>
                Marker name
                <input
                  maxLength={160}
                  onChange={(event) => setMarkerName(event.target.value)}
                  required
                  value={markerName}
                />
              </label>
              <label>
                Marker type
                <select
                  onChange={(event) =>
                    chooseMarkerType(event.target.value)
                  }
                  value={markerType}
                >
                  {campaignMarkerTypes.map((type) => (
                    <option key={type} value={type}>
                      {type[0].toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Linked campaign location
                <select
                  onChange={(event) => setMarkerLocationId(event.target.value)}
                  value={markerLocationId}
                >
                  <option value="">No linked location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox-label">
                <input
                  checked={markerPlayerVisible}
                  onChange={(event) => setMarkerPlayerVisible(event.target.checked)}
                  type="checkbox"
                />
                Visible to players
              </label>
              {markerPlayerVisible &&
              (!selectedMap?.player_visible ||
                (markerLocationId &&
                  !locations.find(
                    (location) => location.id === markerLocationId,
                  )?.player_visible)) ? (
                <p className="notice" role="status">
                  Players will only see this marker when its map and linked
                  location are also visible to them.
                </p>
              ) : null}
              <div className="atlas-marker-actions">
                <button disabled={markerPending} type="submit">
                  {markerPending ? "Saving…" : "Save marker"}
                </button>
                {selectedMarker ? (
                  <>
                    <button
                      disabled={markerPending}
                      onClick={() => {
                        setPendingPoint(undefined);
                        setIsPlacingMarker(true);
                        setMarkersStatus(
                          "Click inside the map artwork to move this marker.",
                        );
                      }}
                      type="button"
                    >
                      Move on map
                    </button>
                    <button
                      disabled={markerPending}
                      onClick={removeSelectedMarker}
                      type="button"
                    >
                      Delete marker
                    </button>
                  </>
                ) : (
                  <button
                    disabled={markerPending}
                    onClick={() => setPendingPoint(undefined)}
                    type="button"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : null}
          {markersStatus ? (
            <p
              className={markersStatus.startsWith("Unable") ? "error" : "notice"}
              role="status"
              aria-live="polite"
            >
              {markersStatus}
            </p>
          ) : null}
        </section>
      ) : null}
      {selectedMap ? (
        <div className="atlas-details">
          <p className="eyebrow">{selectedMap.map_type}</p>
          <h3>{selectedMap.name}</h3>
          {selectedMap.location_name ? (
            <p className="muted">Linked location: {selectedMap.location_name}</p>
          ) : null}
          {selectedMap.description ? (
            <p className="entry-content">{selectedMap.description}</p>
          ) : null}
          {naturalSize.width ? (
            <p className="muted">
              Artwork dimensions: {naturalSize.width.toLocaleString()} ×{" "}
              {naturalSize.height.toLocaleString()} px
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
