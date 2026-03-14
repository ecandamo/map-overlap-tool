"use client";

import { scaleSqrt } from "d3-scale";
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { geoEqualEarth } from "d3-geo";
import { Geographies, Geography, Marker, ComposableMap, Sphere, Graticule } from "react-simple-maps";
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

export function OverlapMap({ points, region, clientLabel, volumeUnitsLabel, colors }: OverlapMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [visibleCategories, setVisibleCategories] = useState<Record<MapPoint["category"], boolean>>({
    "api-only": true,
    "client-only": true,
    overlap: true
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
    () => layeredPoints.filter((point) => visibleCategories[point.category]),
    [layeredPoints, visibleCategories]
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
    { label: "API-Only", color: colors.apiOnly, category: "api-only" as const },
    { label: `${clientLabel}-Only`, color: colors.clientOnly, category: "client-only" as const },
    { label: "Overlap", color: colors.overlap, category: "overlap" as const }
  ];
  const clientOnlyLabel = `${clientLabel}-Only`;

  useEffect(() => {
    if (tooltip && !visibleCategories[tooltip.point.category]) {
      setTooltip(null);
    }
  }, [tooltip, visibleCategories]);

  function getCategoryLabel(category: MapPoint["category"]) {
    if (category === "api-only") {
      return "API-Only";
    }
    if (category === "client-only") {
      return clientOnlyLabel;
    }
    return "Overlap";
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

  function toggleCategory(category: MapPoint["category"]) {
    setVisibleCategories((current) => ({
      ...current,
      [category]: !current[category]
    }));
  }

  return (
    <div
      ref={containerRef}
      className="panel-strong relative rounded-[2.2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.84))] p-4 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.88))]"
    >
      <div className="panel-wash pointer-events-none absolute inset-0 rounded-[2.2rem]" aria-hidden="true" />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="section-eyebrow">Visualization</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">Global overlap map</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{`Shared bubble scale across API-Only, ${clientOnlyLabel}, and overlap airports.`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {legendItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => toggleCategory(item.category)}
              aria-pressed={visibleCategories[item.category]}
              aria-label={`${visibleCategories[item.category] ? "Hide" : "Show"} ${item.label} bubbles`}
              title={`${visibleCategories[item.category] ? "Hide" : "Show"} ${item.label} bubbles`}
              className={`subtle-chip inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition ${
                visibleCategories[item.category]
                  ? "scale-100 text-slate-700 dark:text-slate-200"
                  : "scale-[0.96] opacity-45 text-slate-400 dark:text-slate-500"
              }`}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                <circle cx="12" cy="12" r="5.5" fill={item.color} />
                {!visibleCategories[item.category] ? <path d="M6 18 18 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /> : null}
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
              Turn one or more map icons back on to see airport bubbles again.
            </p>
          </div>
        </div>
      ) : (
      <ComposableMap projection={projection} width={980} height={460} className="h-auto w-full">
        <Sphere fill="transparent" stroke="rgba(148,163,184,0.25)" strokeWidth={0.8} />
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
          const fill =
            point.category === "overlap" ? colors.overlap : point.category === "api-only" ? colors.apiOnly : colors.clientOnly;

          return (
            <Marker
              key={point.iata}
              coordinates={[point.longitude, point.latitude]}
              onMouseEnter={(event: MouseEvent<SVGGElement>) => updateTooltip(event, point)}
              onMouseMove={(event: MouseEvent<SVGGElement>) => updateTooltip(event, point)}
              onMouseLeave={() => setTooltip(null)}
            >
              <circle r={radiusScale(point.totalVolume)} fill={fill} fillOpacity={0.72} stroke="white" strokeWidth={1.5} />
            </Marker>
          );
        })}
      </ComposableMap>
      )}
      {tooltip ? (
        <div
          className="pointer-events-none absolute z-50 min-w-52 rounded-2xl border border-black/10 bg-white/95 p-3 text-sm shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-950/95"
          style={{ left: tooltip.x + 16, top: tooltip.y + 16 }}
        >
          <div className="font-semibold text-slate-950 dark:text-white">{tooltip.point.iata}</div>
          <div className="text-slate-500 dark:text-slate-400">{getCategoryLabel(tooltip.point.category)}</div>
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
