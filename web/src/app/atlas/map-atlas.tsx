"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCampaignMapArtworkUrl } from "./actions";
import type { CampaignAtlasMap } from "@/lib/campaign-atlas";

const minimumZoom = 0.005;
const maximumZoom = 8;

type View = {
  scale: number;
  x: number;
  y: number;
};

function clampZoom(scale: number) {
  return Math.min(maximumZoom, Math.max(minimumZoom, scale));
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
  mapLibraryHref,
}: {
  maps: CampaignAtlasMap[];
  mapLibraryHref: string;
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const loadSequence = useRef(0);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const selectedMap = mapsById.get(selectedId);

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
    if (!artworkUrl || event.button !== 0) {
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
    setView((current) => ({
      ...current,
      x: currentDrag.originX + event.clientX - currentDrag.startX,
      y: currentDrag.originY + event.clientY - currentDrag.startY,
    }));
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
          // eslint-disable-next-line @next/next/no-img-element
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
            style={{
              left: `calc(50% + ${view.x}px)`,
              top: `calc(50% + ${view.y}px)`,
              transform: `translate(-50%, -50%) scale(${view.scale})`,
            }}
          />
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
