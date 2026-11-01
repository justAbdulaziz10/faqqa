"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLngBoundsExpression } from "leaflet";
import type { AreaScore } from "@/lib/radar";
import { scoreColor, scoreLabel } from "@/lib/format";

export default function RadarMap({ areas, selectedId, highlightIds = [], onSelect, city }: {
  areas: AreaScore[];
  city?: { name: string; lat: number; lon: number };
  selectedId: string | null;
  highlightIds?: string[];
  onSelect: (id: string) => void;
}) {
  // The details panel floats over the map's left edge on wide screens, so keep points clear of it.
  const wide = typeof window !== "undefined" && window.innerWidth >= 768;
  const bounds: LatLngBoundsExpression = [
    [Math.min(...areas.map((a) => a.lat)) - 0.6, Math.min(...areas.map((a) => a.lon)) - 0.6],
    [Math.max(...areas.map((a) => a.lat)) + 0.6, Math.max(...areas.map((a) => a.lon)) + 0.6],
  ];
  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ paddingTopLeft: [wide ? 430 : 16, 24], paddingBottomRight: [24, 24] }}
      minZoom={4}
      maxZoom={10}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
      zoomControl={false}
    >
      <ZoomControl position="topright" />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
        maxNativeZoom={17}
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        attribution="Labels &copy; Esri"
        opacity={0.7}
      />
      {areas.map((a) => {
        const active = a.id === selectedId || highlightIds.includes(a.id);
        const color = scoreColor(a.score);
        return (
          <CircleMarker
            key={a.id}
            center={[a.lat, a.lon]}
            radius={6 + a.score / 5 + (active ? 4 : 0)}
            pathOptions={{ color: active ? "#f4e7a1" : "#0f1729", weight: active ? 3 : 1, fillColor: color, fillOpacity: active ? 0.95 : 0.8 }}
            eventHandlers={{ click: () => onSelect(a.id) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <span dir="rtl" style={{ fontFamily: "inherit" }}>
                <b>{a.name}</b>: فرصة {scoreLabel(a.score)}
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}
      {city && (
        <CircleMarker center={[city.lat, city.lon]} radius={5} interactive={false} pathOptions={{ color: "#0f1729", weight: 2, fillColor: "#efe7d6", fillOpacity: 1 }}>
          <Tooltip permanent direction="bottom" offset={[0, 6]} className="city-label">{city.name}</Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
