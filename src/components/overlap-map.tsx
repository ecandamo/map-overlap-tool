"use client";

import { scaleSqrt } from "d3-scale";
import { geoDistance, geoEqualEarth, geoOrthographic } from "d3-geo";
import { MouseEvent, WheelEvent, useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Graticule, Marker, Sphere, ZoomableGroup } from "react-simple-maps";
import world from "world-atlas/countries-110m.json";

import { REGION_ALL } from "@/lib/constants";
import { MapPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type OverlapMapProps = {
  points: MapPoint[];
  region: string;
  clientLabel: string;
  volumeUnitsLabel: string;
  colors: {
    apiOnly: string;
    clientOnly: string;
    overlap: string;
  };
};

type TooltipState = {
  x: number;
  y: number;
  point: MapPoint;
};

type MapMode = "2d" | "3d";

type FlatViewState = {
  coordinates: [number, number];
  zoom: number;
  sessionKey: number;
};

type GlobeViewState = {
  rotation: [number, number, number];
  zoom: number;
};

type MapControlsState = {
  api: boolean;
  client: boolean;
  overlap: boolean;
};

const MAP_WIDTH = 980;
const MAP_HEIGHT = 460;
const GLOBE_CENTER: [number, number] = [MAP_WIDTH / 2, MAP_HEIGHT / 2];
const BASE_GLOBE_SCALE = 210;
const MIN_GLOBE_ZOOM = 1;
const MAX_GLOBE_ZOOM = 3.6;
const DRAG_ROTATION_SENSITIVITY = 0.28;
const DEFAULT_FLAT_VIEW: FlatViewState = {
  coordinates: [0, 0],
  zoom: 1,
  sessionKey: 0
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getAverageCoordinates(points: MapPoint[]): [number, number] {
  if (points.length === 0) {
    return [0, 15];
  }

  let x = 0;
  let y = 0;
  let z = 0;

  for (const point of points) {
    const longitude = (point.longitude * Math.PI) / 180;
    const latitude = (point.latitude * Math.PI) / 180;
    const cosLatitude = Math.cos(latitude);

    x += cosLatitude * Math.cos(longitude);
    y += cosLatitude * Math.sin(longitude);
    z += Math.sin(latitude);
  }

  const total = points.length;
  x /= total;
  y /= total;
  z /= total;

  return [
    Math.atan2(y, x) * (180 / Math.PI),
    Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI)
  ];
}

function buildDefaultGlobeView(points: MapPoint[]): GlobeViewState {
  const [centerLongitude, centerLatitude] = getAverageCoordinates(points);
  const distances = points.map((point) => geoDistance([centerLongitude, centerLatitude], [point.longitude, point.latitude]));
  const maxDistance = distances.length > 0 ? Math.max(...distances) : 0;
  const fittedScale =
    maxDistance > 0 ? clamp(170 / Math.max(Math.sin(maxDistance), 0.35), BASE_GLOBE_SCALE, 420) : BASE_GLOBE_SCALE;

  return {
    rotation: [-centerLongitude, -centerLatitude, 0],
    zoom: fittedScale / BASE_GLOBE_SCALE
  };
}

function getPointLabel(point: MapPoint, clientLabel: string) {
  if (point.apiVolume > 0 && point.clientVolume > 0) {
    return "Overlap Destination";
  }

  if (point.apiVolume > 0) {
    return "API Destination";
  }

  if (point.clientVolume > 0) {
    return `${clientLabel} Destination`;
  }

  return "Destination";
}

function isPointVisible(point: MapPoint, controls: MapControlsState) {
  return (point.apiVolume > 0 && controls.api) || (point.clientVolume > 0 && controls.client);
}

function getPointFill(point: MapPoint, controls: MapControlsState, colors: OverlapMapProps["colors"]) {
  const isOverlapPoint = point.apiVolume > 0 && point.clientVolume > 0;

  if (controls.overlap && isOverlapPoint) {
    return colors.overlap;
  }

  if (point.apiVolume > 0 && controls.api) {
    return colors.apiOnly;
  }

  return colors.clientOnly;
}

function buildProjection(points: MapPoint[], region: string) {
  const projection = geoEqualEarth();
  const fitExtent: [[number, number], [number, number]] = [
    [28, 18],
    [952, 442]
  ];

  if (points.length === 0 || !region || region === REGION_ALL) {
    projection.fitExtent(fitExtent, {
      type: "Polygon",
      coordinates: [[
        [-180, -62],
        [-180, 84],
        [180, 84],
        [180, -62],
        [-180, -62]
      ]]
    });
    return projection;
  }

  const longitudes = points.map((point) => point.longitude);
  const latitudes = points.map((point) => point.latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const longitudePadding = Math.max(12, (maxLongitude - minLongitude) * 0.35);
  const latitudePadding = Math.max(8, (maxLatitude - minLatitude) * 0.35);

  projection.fitExtent(
    fitExtent,
    {
      type: "Polygon",
      coordinates: [[
        [Math.max(-180, minLongitude - longitudePadding), Math.max(-62, minLatitude - latitudePadding)],
        [Math.max(-180, minLongitude - longitudePadding), Math.min(84, maxLatitude + latitudePadding)],
        [Math.min(180, maxLongitude + longitudePadding), Math.min(84, maxLatitude + latitudePadding)],
        [Math.min(180, maxLongitude + longitudePadding), Math.max(-62, minLatitude - latitudePadding)],
        [Math.max(-180, minLongitude - longitudePadding), Math.max(-62, minLatitude - latitudePadding)]
      ]]
    }
  );

  return projection;
}

export function OverlapMap({ points, region, clientLabel, volumeUnitsLabel, colors }: OverlapMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>("2d");
  const [flatView, setFlatView] = useState<FlatViewState>(DEFAULT_FLAT_VIEW);
  const [globeView, setGlobeView] = useState<GlobeViewState>(() => buildDefaultGlobeView(points));
  const [mapControls, setMapControls] = useState<MapControlsState>({
    api: false,
    client: true,
    overlap: false
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const globeInteractionRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ x: number; y: number } | null>(null);

  const clientDestinationsLabel = `${clientLabel} Destinations`;
  const maxVolume = Math.max(...points.map((point) => point.totalVolume), 1);
  const radiusScale = useMemo(() => scaleSqrt().domain([0, maxVolume]).range([4, 24]), [maxVolume]);
  const layeredPoints = useMemo(() => {
    const layerPriority: Record<MapPoint["category"], number> = {
      "api-only": 0,
      "client-only": 1,
      overlap: 2
    };

    return [...points].sort((left, right) => {
      const priorityDiff = layerPriority[left.category] - layerPriority[right.category];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return left.iata.localeCompare(right.iata);
    });
  }, [points]);
  const visiblePoints = useMemo(() => layeredPoints.filter((point) => isPointVisible(point, mapControls)), [layeredPoints, mapControls]);
  const flatProjection = useMemo(() => buildProjection(points, region), [points, region]);
  const globeProjection = useMemo(
    () =>
      geoOrthographic()
        .translate(GLOBE_CENTER)
        .scale(BASE_GLOBE_SCALE * globeView.zoom)
        .rotate(globeView.rotation)
        .clipAngle(90)
        .precision(0.5),
    [globeView]
  );
  const frontHemisphereCenter = useMemo<[number, number]>(() => [-globeView.rotation[0], -globeView.rotation[1]], [globeView.rotation]);
  const globeVisiblePoints = useMemo(
    () => visiblePoints.filter((point) => geoDistance(frontHemisphereCenter, [point.longitude, point.latitude]) <= Math.PI / 2 - 0.02),
    [frontHemisphereCenter, visiblePoints]
  );
  const defaultGlobeView = useMemo(() => buildDefaultGlobeView(points), [points]);
  const isFlatViewDirty =
    flatView.zoom > 1.02 || Math.abs(flatView.coordinates[0]) > 0.01 || Math.abs(flatView.coordinates[1]) > 0.01;
  const isGlobeViewDirty =
    Math.abs(globeView.zoom - defaultGlobeView.zoom) > 0.01 ||
    Math.abs(globeView.rotation[0] - defaultGlobeView.rotation[0]) > 0.01 ||
    Math.abs(globeView.rotation[1] - defaultGlobeView.rotation[1]) > 0.01;
  const isViewDirty = mapMode === "2d" ? isFlatViewDirty : isGlobeViewDirty;
  const legendItems = [
    { label: clientDestinationsLabel, color: colors.clientOnly, key: "client" as const },
    { label: "Overlap Highlight", color: colors.overlap, key: "overlap" as const },
    { label: "API Destinations", color: colors.apiOnly, key: "api" as const }
  ];

  useEffect(() => {
    if (!tooltip) {
      return;
    }

    if (!isPointVisible(tooltip.point, mapControls)) {
      setTooltip(null);
      return;
    }

    if (mapMode === "3d" && !globeVisiblePoints.some((point) => point.iata === tooltip.point.iata)) {
      setTooltip(null);
    }
  }, [globeVisiblePoints, mapControls, mapMode, tooltip]);

  useEffect(() => {
    setFlatView((current) => ({
      coordinates: DEFAULT_FLAT_VIEW.coordinates,
      zoom: DEFAULT_FLAT_VIEW.zoom,
      sessionKey: current.sessionKey + 1
    }));
    setGlobeView(buildDefaultGlobeView(points));
    setTooltip(null);
  }, [points]);

  useEffect(() => {
    const node = globeInteractionRef.current;
    if (!node || mapMode !== "3d") {
      return;
    }

    const listener = (event: globalThis.WheelEvent) => handleGlobeWheel(event);
    node.addEventListener("wheel", listener, { passive: false });

    return () => {
      node.removeEventListener("wheel", listener);
    };
  }, [mapMode]);

  function updateTooltip(event: MouseEvent<SVGGElement>, point: MapPoint) {
    const bounds = containerRef.current?.getBoundingClientRect();

    setTooltip({
      x: bounds ? event.clientX - bounds.left : event.clientX,
      y: bounds ? event.clientY - bounds.top : event.clientY,
      point
    });
  }

  function toggleControl(control: keyof MapControlsState) {
    setMapControls((current) => ({
      ...current,
      [control]: !current[control]
    }));
  }

  function handleResetView() {
    if (mapMode === "2d") {
      setFlatView((current) => ({
        coordinates: DEFAULT_FLAT_VIEW.coordinates,
        zoom: DEFAULT_FLAT_VIEW.zoom,
        sessionKey: current.sessionKey + 1
      }));
    } else {
      setGlobeView(buildDefaultGlobeView(points));
      dragStateRef.current = null;
    }

    setTooltip(null);
  }

  function handleGlobePointerDown(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    dragStateRef.current = { x: event.clientX, y: event.clientY };
    setTooltip(null);
  }

  function handleGlobePointerMove(event: MouseEvent<HTMLDivElement>) {
    if (!dragStateRef.current) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.x;
    const deltaY = event.clientY - dragStateRef.current.y;

    dragStateRef.current = { x: event.clientX, y: event.clientY };
    setGlobeView((current) => ({
      ...current,
      rotation: [
        current.rotation[0] + deltaX * (DRAG_ROTATION_SENSITIVITY / current.zoom),
        clamp(current.rotation[1] - deltaY * (DRAG_ROTATION_SENSITIVITY / current.zoom), -85, 85),
        0
      ]
    }));
  }

  function handleGlobePointerUp() {
    dragStateRef.current = null;
  }

  function handleGlobeWheel(event: WheelEvent | globalThis.WheelEvent) {
    event.preventDefault();
    event.stopPropagation();
    setTooltip(null);
    setGlobeView((current) => ({
      ...current,
      zoom: clamp(current.zoom * (event.deltaY > 0 ? 0.92 : 1.08), MIN_GLOBE_ZOOM, MAX_GLOBE_ZOOM)
    }));
  }

  function renderMarker(point: MapPoint) {
    const radius = radiusScale(point.totalVolume);
    const isOverlapPoint = point.apiVolume > 0 && point.clientVolume > 0;
    const splitBubble = isOverlapPoint && mapControls.api && mapControls.client && !mapControls.overlap;
    const fill = getPointFill(point, mapControls, colors);
    const markerIdPrefix = `${mapMode}-${point.iata}`;

    return (
      <Marker
        key={point.iata}
        coordinates={[point.longitude, point.latitude]}
        onMouseEnter={(event: MouseEvent<SVGGElement>) => updateTooltip(event, point)}
        onMouseMove={(event: MouseEvent<SVGGElement>) => updateTooltip(event, point)}
        onMouseLeave={() => setTooltip(null)}
      >
        {splitBubble ? (
          <>
            <defs>
              <clipPath id={`${markerIdPrefix}-api-half`}>
                <rect x={-radius} y={-radius} width={radius} height={radius * 2} />
              </clipPath>
              <clipPath id={`${markerIdPrefix}-client-half`}>
                <rect x={0} y={-radius} width={radius} height={radius * 2} />
              </clipPath>
            </defs>
            <circle r={radius} fill={colors.apiOnly} fillOpacity={0.72} clipPath={`url(#${markerIdPrefix}-api-half)`} />
            <circle r={radius} fill={colors.clientOnly} fillOpacity={0.72} clipPath={`url(#${markerIdPrefix}-client-half)`} />
            <circle r={radius} fill="transparent" stroke="white" strokeWidth={1.5} />
          </>
        ) : (
          <circle r={radius} fill={fill} fillOpacity={0.72} stroke="white" strokeWidth={1.5} />
        )}
      </Marker>
    );
  }

  function renderMapSurface() {
    if (mapMode === "2d") {
      return (
        <ComposableMap projection={flatProjection} width={MAP_WIDTH} height={MAP_HEIGHT} className="h-auto w-full select-none">
          <ZoomableGroup
            key={flatView.sessionKey}
            center={flatView.coordinates}
            zoom={flatView.zoom}
            minZoom={1}
            maxZoom={6}
            onMoveEnd={({ coordinates, zoom }: { coordinates: number[]; zoom: number }) => {
              setFlatView((current) => ({
                ...current,
                coordinates: coordinates as [number, number],
                zoom
              }));
            }}
          >
            <Graticule stroke="rgba(148,163,184,0.15)" strokeWidth={0.4} />
            <Geographies geography={world}>
              {({ geographies }: { geographies: Array<{ rsmKey: string; [key: string]: unknown }> }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="rgba(148, 163, 184, 0.18)"
                    stroke="rgba(100, 116, 139, 0.35)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "rgba(148, 163, 184, 0.28)" },
                      pressed: { outline: "none" }
                    }}
                  />
                ))
              }
            </Geographies>
            {visiblePoints.map((point) => renderMarker(point))}
          </ZoomableGroup>
        </ComposableMap>
      );
    }

    return (
      <div
        ref={globeInteractionRef}
        onMouseDown={handleGlobePointerDown}
        onMouseMove={handleGlobePointerMove}
        onMouseUp={handleGlobePointerUp}
        onMouseLeave={handleGlobePointerUp}
        className="overscroll-contain"
        style={{ cursor: dragStateRef.current ? "grabbing" : "grab" }}
      >
        <ComposableMap projection={globeProjection} width={MAP_WIDTH} height={MAP_HEIGHT} className="h-auto w-full select-none">
          <Sphere id="globe-sphere" fill="transparent" stroke="rgba(148,163,184,0.25)" strokeWidth={0.8} />
          <g clipPath="url(#globe-sphere)">
            <Graticule stroke="rgba(148,163,184,0.15)" strokeWidth={0.4} />
            <Geographies geography={world}>
              {({ geographies }: { geographies: Array<{ rsmKey: string; [key: string]: unknown }> }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="rgba(148, 163, 184, 0.18)"
                    stroke="rgba(100, 116, 139, 0.35)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "rgba(148, 163, 184, 0.28)" },
                      pressed: { outline: "none" }
                    }}
                  />
                ))
              }
            </Geographies>
            {globeVisiblePoints.map((point) => renderMarker(point))}
          </g>
        </ComposableMap>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="panel-strong relative rounded-[2.2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.84))] p-4 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.88))]"
    >
      <div className="panel-wash pointer-events-none absolute inset-0 rounded-[2.2rem]" aria-hidden="true" />
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow">Visualization</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">Global Overlap Map</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {`Shared bubble scale across API destinations, ${clientDestinationsLabel.toLowerCase()}, and overlap highlights.`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="subtle-chip inline-flex rounded-full p-1">
              {(["2d", "3d"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMapMode(mode)}
                  aria-pressed={mapMode === mode}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    mapMode === mode ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {mode === "2d" ? "2D Map" : "3D Globe"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleResetView}
              disabled={!isViewDirty}
              className={`subtle-chip rounded-full px-3 py-2 text-xs font-medium transition ${
                isViewDirty ? "text-slate-700 dark:text-slate-200" : "cursor-not-allowed opacity-45 text-slate-400 dark:text-slate-500"
              }`}
            >
              Reset View
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {legendItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => toggleControl(item.key)}
                aria-pressed={mapControls[item.key]}
                aria-label={`${mapControls[item.key] ? "Disable" : "Enable"} ${item.label}`}
                title={`${mapControls[item.key] ? "Disable" : "Enable"} ${item.label}`}
                className={`subtle-chip inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition ${
                  mapControls[item.key]
                    ? "scale-100 text-slate-700 dark:text-slate-200"
                    : "scale-[0.96] opacity-45 text-slate-400 dark:text-slate-500"
                }`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                  <circle cx="12" cy="12" r="5.5" fill={item.color} />
                  {!mapControls[item.key] ? <path d="M6 18 18 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /> : null}
                </svg>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {points.length === 0 ? (
        <div className="flex min-h-[28rem] items-center justify-center rounded-[1.5rem] border border-dashed border-black/10 bg-white/40 text-center dark:border-white/10 dark:bg-white/5">
          <div className="max-w-md px-6">
            <h4 className="text-xl font-semibold text-slate-950 dark:text-white">No Mapped Destinations Yet</h4>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Upload both CSVs with at least one airport that exists in the reference database, or change the region filter back to all regions.
            </p>
          </div>
        </div>
      ) : visiblePoints.length === 0 ? (
        <div className="flex min-h-[28rem] items-center justify-center rounded-[1.5rem] border border-dashed border-black/10 bg-white/40 text-center dark:border-white/10 dark:bg-white/5">
          <div className="max-w-md px-6">
            <h4 className="text-xl font-semibold text-slate-950 dark:text-white">All Bubble Types Hidden</h4>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Turn API or client destinations back on to see airport bubbles again. Overlap only changes shared-airport coloring.
            </p>
          </div>
        </div>
      ) : renderMapSurface()}
      {tooltip ? (
        <div
          className="pointer-events-none absolute z-50 min-w-52 rounded-2xl border border-black/10 bg-white/95 p-3 text-sm shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-950/95"
          style={{ left: tooltip.x + 16, top: tooltip.y + 16 }}
        >
          <div className="font-semibold text-slate-950 dark:text-white">{tooltip.point.iata}</div>
          <div className="text-slate-500 dark:text-slate-400">{getPointLabel(tooltip.point, clientLabel)}</div>
          <div className="text-slate-500 dark:text-slate-400">
            {tooltip.point.city}, {tooltip.point.country}
          </div>
          <div className="mt-2 text-slate-700 dark:text-slate-200">API {volumeUnitsLabel}: {formatNumber(tooltip.point.apiVolume)}</div>
          <div className="text-slate-700 dark:text-slate-200">{clientLabel} {volumeUnitsLabel}: {formatNumber(tooltip.point.clientVolume)}</div>
        </div>
      ) : null}
    </div>
  );
}
