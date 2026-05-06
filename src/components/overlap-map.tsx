"use client";

import { scaleSqrt } from "d3-scale";
import { geoDistance, geoEqualEarth, geoOrthographic } from "d3-geo";
import { MouseEvent, WheelEvent, useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Graticule, Marker, Sphere, ZoomableGroup } from "react-simple-maps";
import world from "world-atlas/countries-110m.json";

import { REGION_ALL } from "@/lib/constants";
import { MapPoint } from "@/lib/types";
import { downloadHtmlFile, formatNumber } from "@/lib/utils";

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

  function findMapSvgElement(root: HTMLElement): SVGElement | null {
    const candidates = Array.from(root.querySelectorAll("svg"));
    let best: SVGElement | null = null;
    let bestArea = 0;
    for (const svg of candidates) {
      const vb = svg.getAttribute("viewBox");
      let area = 0;
      if (vb) {
        const parts = vb.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
          area = parts[2] * parts[3];
        }
      }
      if (area === 0) {
        const rect = svg.getBoundingClientRect();
        area = rect.width * rect.height;
      }
      if (area > bestArea) {
        bestArea = area;
        best = svg;
      }
    }
    if (best && bestArea < MAP_WIDTH * MAP_HEIGHT * 0.5) {
      return null;
    }
    return best;
  }

  function handleDownloadHtml() {
    const container = containerRef.current;
    if (!container) return;

    const svgEl = findMapSvgElement(container);
    if (!svgEl) return;

    // Clone SVG and annotate marker groups with data-iata for tooltip interactivity
    const svgClone = svgEl.cloneNode(true) as SVGElement;
    svgClone.setAttribute("width", "100%");
    svgClone.removeAttribute("height");
    svgClone.style.cssText = "display:block;";

    // Marker groups are <g transform="translate(...)"> elements whose direct children
    // include a circle with stroke="white" and no nested <g transform> children.
    const isMarkerGroup = (g: Element): boolean => {
      if (!g.getAttribute("transform")?.startsWith("translate(")) return false;
      if (g.querySelector("g[transform]")) return false;
      return !!g.querySelector('circle[stroke="white"]');
    };
    const cloneMarkerGroups = Array.from(svgClone.querySelectorAll("g[transform]")).filter(isMarkerGroup);
    visiblePoints.forEach((point, i) => {
      if (cloneMarkerGroups[i]) {
        cloneMarkerGroups[i].setAttribute("data-iata", point.iata);
        (cloneMarkerGroups[i] as SVGElement).style.cursor = "pointer";
      }
    });

    const svgString = new XMLSerializer().serializeToString(svgClone);

    const isDark = document.documentElement.classList.contains("dark");
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // Palette derived from Tailwind tokens used in the live card
    const bgPage = isDark ? "#0a0f1e" : "#f1f5f9";
    const bgCard = isDark ? "rgba(15,23,42,0.97)" : "rgba(255,255,255,0.97)";
    const borderCard = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
    const textPrimary = isDark ? "#ffffff" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";
    const textMuted = isDark ? "#64748b" : "#94a3b8";
    const tooltipBg = isDark ? "rgba(2,6,23,0.97)" : "rgba(255,255,255,0.97)";
    const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
    const tooltipVolume = isDark ? "#e2e8f0" : "#334155";

    const activeLegendItems = legendItems.filter((item) => mapControls[item.key]);
    const legendHtml = activeLegendItems
      .map(
        (item) =>
          `<span class="legend-item"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="5.5" fill="${item.color}"/></svg>${item.label}</span>`
      )
      .join("");

    const pointsJson = JSON.stringify(
      visiblePoints.map((p) => ({
        iata: p.iata,
        city: p.city,
        country: p.country,
        apiVolume: p.apiVolume,
        clientVolume: p.clientVolume,
      }))
    );

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Global Overlap Map \u2014 ${dateStr}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      background: ${bgPage};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .card {
      background: ${bgCard};
      border-radius: 2rem;
      padding: 1.5rem;
      max-width: 1100px;
      width: 100%;
      box-shadow: 0 0 0 1px ${borderCard}, 0 8px 32px -4px rgba(0,0,0,0.14);
    }
    .eyebrow {
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: ${textMuted};
    }
    .title {
      font-size: 1.125rem;
      font-weight: 600;
      color: ${textPrimary};
      margin-top: 0.45rem;
    }
    .subtitle {
      font-size: 0.8rem;
      color: ${textSecondary};
      margin-top: 0.2rem;
    }
    .map-wrap {
      margin-top: 1rem;
      border-radius: 1.25rem;
      overflow: hidden;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      margin-top: 1rem;
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 500;
      color: ${textSecondary};
      background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"};
      border: 1px solid ${borderCard};
      border-radius: 999px;
      padding: 0.3rem 0.65rem;
    }
    .footer {
      margin-top: 0.85rem;
      font-size: 0.68rem;
      color: ${textMuted};
    }
    #tooltip {
      position: fixed;
      display: none;
      background: ${tooltipBg};
      border: 1px solid ${tooltipBorder};
      border-radius: 1rem;
      padding: 0.7rem 0.85rem;
      font-size: 0.8rem;
      line-height: 1.5;
      box-shadow: 0 20px 40px -8px rgba(0,0,0,0.2);
      pointer-events: none;
      z-index: 9999;
      min-width: 190px;
    }
    #tooltip .tt-iata { font-weight: 600; color: ${textPrimary}; }
    #tooltip .tt-meta { color: ${textSecondary}; }
    #tooltip .tt-vol { color: ${tooltipVolume}; margin-top: 0.4rem; }
  </style>
</head>
<body>
  <div class="card">
    <p class="eyebrow">Visualization</p>
    <h1 class="title">Global Overlap Map</h1>
    <p class="subtitle">Exported ${dateStr}</p>
    <div class="map-wrap">${svgString}</div>
    ${activeLegendItems.length > 0 ? `<div class="legend">${legendHtml}</div>` : ""}
    <p class="footer">Generated by Map Overlap Tool</p>
  </div>
  <div id="tooltip">
    <div class="tt-iata" id="tt-iata"></div>
    <div class="tt-meta" id="tt-type"></div>
    <div class="tt-meta" id="tt-loc"></div>
    <div class="tt-vol" id="tt-api"></div>
    <div class="tt-vol" id="tt-client"></div>
  </div>
  <script>
    (function () {
      var POINTS = ${pointsJson};
      var CLIENT_LABEL = ${JSON.stringify(clientLabel)};
      var VOL_LABEL = ${JSON.stringify(volumeUnitsLabel)};
      var byIata = {};
      POINTS.forEach(function (p) { byIata[p.iata] = p; });

      var tooltip = document.getElementById("tooltip");
      var ttIata = document.getElementById("tt-iata");
      var ttType = document.getElementById("tt-type");
      var ttLoc = document.getElementById("tt-loc");
      var ttApi = document.getElementById("tt-api");
      var ttClient = document.getElementById("tt-client");

      function fmt(n) { return new Intl.NumberFormat("en-US").format(n); }
      function label(p) {
        if (p.apiVolume > 0 && p.clientVolume > 0) return "Overlap Destination";
        if (p.apiVolume > 0) return "API Destination";
        return CLIENT_LABEL + " Destination";
      }

      function showTip(e, p) {
        ttIata.textContent = p.iata;
        ttType.textContent = label(p);
        ttLoc.textContent = p.city + ", " + p.country;
        ttApi.textContent = "API " + VOL_LABEL + ": " + fmt(p.apiVolume);
        ttClient.textContent = CLIENT_LABEL + " " + VOL_LABEL + ": " + fmt(p.clientVolume);
        tooltip.style.display = "block";
        moveTip(e);
      }
      function moveTip(e) {
        var x = e.clientX + 16;
        var y = e.clientY + 16;
        var tw = tooltip.offsetWidth;
        var th = tooltip.offsetHeight;
        if (x + tw > window.innerWidth - 8) x = e.clientX - tw - 12;
        if (y + th > window.innerHeight - 8) y = e.clientY - th - 12;
        tooltip.style.left = x + "px";
        tooltip.style.top = y + "px";
      }
      function hideTip() { tooltip.style.display = "none"; }

      document.querySelectorAll("g[data-iata]").forEach(function (g) {
        var iata = g.getAttribute("data-iata");
        var p = byIata[iata];
        if (!p) return;
        g.addEventListener("mouseenter", function (e) { showTip(e, p); });
        g.addEventListener("mousemove", function (e) { moveTip(e); });
        g.addEventListener("mouseleave", hideTip);
      });
    })();
  </script>
</body>
</html>`;

    downloadHtmlFile("overlap-map.html", html);
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
            {visiblePoints.length > 0 ? (
              <button
                type="button"
                onClick={handleDownloadHtml}
                title="Download map as a self-contained HTML file"
                className="subtle-chip inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-slate-700 transition dark:text-slate-200"
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 3v9M6.5 8.5 10 12l3.5-3.5" />
                  <path d="M3 14v1.5A1.5 1.5 0 0 0 4.5 17h11A1.5 1.5 0 0 0 17 15.5V14" />
                </svg>
                Export HTML
              </button>
            ) : null}
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
