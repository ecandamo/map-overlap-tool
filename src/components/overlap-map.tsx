"use client";

import { scaleSqrt } from "d3-scale";
import { MouseEvent, useMemo, useState } from "react";
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

export function OverlapMap({ points, region, clientLabel, colors }: OverlapMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const maxVolume = Math.max(...points.map((point) => point.totalVolume), 1);
  const radiusScale = useMemo(() => scaleSqrt().domain([0, maxVolume]).range([4, 24]), [maxVolume]);
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
    { label: "API-Only", color: colors.apiOnly },
    { label: `${clientLabel}-Only`, color: colors.clientOnly },
    { label: "Overlap", color: colors.overlap }
  ];
  const clientOnlyLabel = `${clientLabel}-Only`;

  function getCategoryLabel(category: MapPoint["category"]) {
    if (category === "api-only") {
      return "API-Only";
    }
    if (category === "client-only") {
      return clientOnlyLabel;
    }
    return "Overlap";
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.18),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.82))] p-4 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.16),_transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.86))]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Global Overlap Map</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{`Shared Bubble Scale Across API-Only, ${clientOnlyLabel}, and Overlap Airports.`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {legendItems.map((item) => (
            <div key={item.label} className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-medium text-slate-700 backdrop-blur dark:bg-slate-950/50 dark:text-slate-200">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </div>
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
        {points.map((point) => {
          const fill =
            point.category === "overlap" ? colors.overlap : point.category === "api-only" ? colors.apiOnly : colors.clientOnly;

          return (
            <Marker
              key={point.iata}
              coordinates={[point.longitude, point.latitude]}
              onMouseEnter={(event: MouseEvent<SVGGElement>) =>
                setTooltip({
                  x: event.clientX,
                  y: event.clientY,
                  point
                })
              }
              onMouseMove={(event: MouseEvent<SVGGElement>) =>
                setTooltip({
                  x: event.clientX,
                  y: event.clientY,
                  point
                })
              }
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
          className="pointer-events-none fixed z-50 min-w-52 rounded-2xl border border-black/10 bg-white/95 p-3 text-sm shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-950/95"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <div className="font-semibold text-slate-950 dark:text-white">{tooltip.point.iata}</div>
          <div className="text-slate-500 dark:text-slate-400">{getCategoryLabel(tooltip.point.category)}</div>
          <div className="text-slate-500 dark:text-slate-400">
            {tooltip.point.city}, {tooltip.point.country}
          </div>
          <div className="mt-2 text-slate-700 dark:text-slate-200">API Volume: {formatNumber(tooltip.point.apiVolume)}</div>
          <div className="text-slate-700 dark:text-slate-200">{clientLabel} Volume: {formatNumber(tooltip.point.clientVolume)}</div>
        </div>
      ) : null}
    </div>
  );
}
