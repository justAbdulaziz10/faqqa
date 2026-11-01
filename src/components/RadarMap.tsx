"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { AreaScore } from "@/lib/radar";
import { scoreColor } from "@/lib/format";

export default function RadarMap({ areas, selectedId, highlightIds = [], onSelect }: {
  areas: AreaScore[];
  selectedId: string | null;
  highlightIds?: string[];
  onSelect: (id: string) => void;
}) {
  return (
    <MapContainer center={[27.6, 43.8]} zoom={5} minZoom={4} maxZoom={9} scrollWheelZoom={false} className="h-full w-full" attributionControl>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />
      {areas.map((a) => {
        const active = a.id === selectedId || highlightIds.includes(a.id);
        const color = scoreColor(a.score);
        return (
          <CircleMarker
            key={a.id}
            center={[a.lat, a.lon]}
            radius={8 + a.score / 6 + (active ? 6 : 0)}
            pathOptions={{ color: active ? "#ecdcbc" : color, weight: active ? 3 : 1.5, fillColor: color, fillOpacity: active ? 0.85 : 0.55 }}
            eventHandlers={{ click: () => onSelect(a.id) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <span dir="rtl" style={{ fontFamily: "inherit" }}>
                <b>{a.name}</b> · {a.score}/100 · {a.label}
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
