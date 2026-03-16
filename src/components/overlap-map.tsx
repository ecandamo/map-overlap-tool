"use client";

import { scaleSqrt } from "d3-scale";
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { geoEqualEarth } from "d3-geo";
import { Geographies, Geography, Marker, ComposableMap, Sphere, Graticule, ZoomableGroup } from "react-simple-maps";
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

type ZoomState = {
  coordinates: [number, number];
  zoom: number;
};

const DEFAULT_ZOOM_STATE: ZoomState = {
  coordinates: [0, 0],
  zoom: 1
};

export function OverlapMap({ points, region, clientLabel, volumeUnitsLabel, colors }: OverlapMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [zoomState, setZoomState] = useState<ZoomState>(DEFAULT_ZOOM_STATE);
  const [zoomSessionKey, setZoomSessionKey] = useState(0);
  const [mapControls, setMapControls] = useState({
    api: false,
    client: true,
    overlap: false
  });
  const containerRef = useRef<HTMLDivElement>(null);

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
  const visiblePoints = useMemo(
    () =>
      layeredPoints.filter((point) => {
        const hasApi = point.apiVolume > 0;
        const hasClient = point.clientVolume > 0;

        return (hasApi && mapControls.api) || (hasClient && mapControls.client);
      }),
    [layeredPoints, mapControls]
  );
  const projection = useMemo(() => {
    const nextProjection = geoEqualEarth();

    if (points.length === 0 || !region || region === REGION_ALL) {
      return nextProjection;
    }

    const longitudes = points.map((point) => point.longitude);
    const latitudes = points.map((point) => point.latitude);
    const minLongitude = Math.min(...longitudes);
    const maxLongitude = Math.max(...longitudes);
    const minLatitude = Math.min(...latitudes);
    const maxLatitude = Math.max(...latitudes);
    const longitudePadding = Math.max(12, (maxLongitude - minLongitude) * 0.35);
    const latitudePadding = Math.max(8, (maxLatitude - minLatitude) * 0.35);

    nextProjection.fitExtent(
      [
        [56, 36],
        [924, 424]
      ],
      {
        type: "Polygon",
        coordinates: [[
          [Math.max(-180, minLongitude - longitudePadding), Math.max(-85, minLatitude - latitudePadding)],
          [Math.max(-180, minLongitude - longitudePadding), Math.min(85, maxLatitude + latitudePadding)],
          [Math.min(180, maxLongitude + longitudePadding), Math.min(85, maxLatitude + latitudePadding)],
          [Math.min(180, maxLongitude + longitudePadding), Math.max(-85, minLatitude - latitudePadding)],
          [Math.max(-180, minLongitude - longitudePadding), Math.max(-85, minLatitude - latitudePadding)]
        ]]
      }
    );

    return nextProjection;
  }, [points, region]);
  const legendItems = [
    { label: `${clientLabel} Destinations`, color: colors.clientOnly, key: "client" as const },
    { label: "Overlap Highlight", color: colors.overlap, key: "overlap" as const },
    { label: "API Destinations", color: colors.apiOnly, key: "api" as const }
  ];
  const clientDestinationsLabel = `${clientLabel} Destinations`;

  useEffect(() => {
    if (!tooltip) {
      return;
    }

    const point = tooltip.point;
    const hasApi = point.apiVolume > 0;
    const hasClient = point.clientVolume > 0;

    if (!((hasApi && mapControls.api) || (hasClient && mapControls.client))) {
      setTooltip(null);
    }
  }, [mapControls, tooltip]);

  useEffect(() => {
    setZoomState(DEFAULT_ZOOM_STATE);
    setZoomSessionKey((current) => current + 1);
  }, [region, points]);

  function getPointLabel(point: MapPoint) {
    const hasApi = point.apiVolume > 0;
    const hasClient = point.clientVolume > 0;

    if (hasApi && hasClient) {
      return "Overlap Destination";
    }
    if (hasApi) {
      return "API Destination";
    }
    if (hasClient) {
      return `${clientLabel} Destination`;
    }

    return "Destination";
  }

  function updateTooltip(event: MouseEvent<SVGGElement>, point: MapPoint) {
    const container = containerRef.current;
    const bounds = container?.getBoundingClientRect();

    setTooltip({
      x: bounds ? event.clientX - bounds.left : event.clientX,
      y: bounds ? event.clientY - bounds.top : event.clientY,
      point
    });
  }

  function toggleControl(control: "api" | "client" | "overlap") {
    setMapControls((current) => ({
      ...current,
      [control]: !current[control]
    }));
  }

  function handleResetView() {
    setZoomState(DEFAULT_ZOOM_STATE);
    setZoomSessionKey((current) => current + 1);
  }

  const isZoomed = zoomState.zoom > 1.02 || Math.abs(zoomState.coordinates[0]) > 0.01 || Math.abs(zoomState.coordinates[1]) > 0.01;

  return (
    <div
      ref={containerRef}
      className="panel-strong relative rounded-[2.2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.84))] p-4 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.88))]"
    >
      <div className="panel-wash pointer-events-none absolute inset-0 rounded-[2.2rem]" aria-hidden="true" />
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="section-eyebrow">Visualization</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">Global Overlap Map</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{`Shared bubble scale across API destinations, ${clientDestinationsLabel.toLowerCase()}, and overlap highlights.`}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleResetView}
            disabled={!isZoomed}
            className={`subtle-chip rounded-full px-3 py-2 text-xs font-medium transition ${
              isZoomed ? "text-slate-700 dark:text-slate-200" : "cursor-not-allowed opacity-45 text-slate-400 dark:text-slate-500"
            }`}
          >
            Reset View
          </button>
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
      ) : (
      <ComposableMap projection={projection} width={980} height={460} className="h-auto w-full">
        <Sphere fill="transparent" stroke="rgba(148,163,184,0.25)" strokeWidth={0.8} />
        <ZoomableGroup
          key={zoomSessionKey}
          center={zoomState.coordinates}
          zoom={zoomState.zoom}
          minZoom={1}
          maxZoom={6}
          onMoveEnd={({ coordinates, zoom }: { coordinates: number[]; zoom: number }) => {
            setZoomState({
              coordinates: coordinates as [number, number],
              zoom
            });
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
          {visiblePoints.map((point) => {
            const radius = radiusScale(point.totalVolume);
            const hasApi = point.apiVolume > 0;
            const hasClient = point.clientVolume > 0;
            const isOverlapPoint = hasApi && hasClient;
            const splitBubble = isOverlapPoint && mapControls.api && mapControls.client && !mapControls.overlap;
            const fill = mapControls.overlap && isOverlapPoint
              ? colors.overlap
              : hasApi && mapControls.api
                ? colors.apiOnly
                : colors.clientOnly;

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
                      <clipPath id={`${point.iata}-api-half`}>
                        <rect x={-radius} y={-radius} width={radius} height={radius * 2} />
                      </clipPath>
                      <clipPath id={`${point.iata}-client-half`}>
                        <rect x={0} y={-radius} width={radius} height={radius * 2} />
                      </clipPath>
                    </defs>
                    <circle r={radius} fill={colors.apiOnly} fillOpacity={0.72} clipPath={`url(#${point.iata}-api-half)`} />
                    <circle r={radius} fill={colors.clientOnly} fillOpacity={0.72} clipPath={`url(#${point.iata}-client-half)`} />
                    <circle r={radius} fill="transparent" stroke="white" strokeWidth={1.5} />
                  </>
                ) : (
                  <circle r={radius} fill={fill} fillOpacity={0.72} stroke="white" strokeWidth={1.5} />
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      )}
      {tooltip ? (
        <div
          className="pointer-events-none absolute z-50 min-w-52 rounded-2xl border border-black/10 bg-white/95 p-3 text-sm shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-950/95"
          style={{ left: tooltip.x + 16, top: tooltip.y + 16 }}
        >
          <div className="font-semibold text-slate-950 dark:text-white">{tooltip.point.iata}</div>
          <div className="text-slate-500 dark:text-slate-400">{getPointLabel(tooltip.point)}</div>
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
