"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ORIGINS, type Origin } from "@/lib/areas";

const KEY = "faqqa:city";
const Ctx = createContext<{ city: Origin; setCityId: (id: string) => void }>({ city: ORIGINS[0], setCityId: () => {} });

/** The user's home city, shared by the map, the area list and the advisor. */
export function CityProvider({ children }: { children: React.ReactNode }) {
  const [cityId, setCityIdState] = useState(ORIGINS[0].id);

  // Read after mount so the server HTML and the first client render match.
  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from storage
    if (saved && ORIGINS.some((o) => o.id === saved)) setCityIdState(saved);
  }, []);

  function setCityId(id: string) {
    setCityIdState(id);
    try { window.localStorage.setItem(KEY, id); } catch {}
  }

  const city = ORIGINS.find((o) => o.id === cityId) ?? ORIGINS[0];
  return <Ctx.Provider value={{ city, setCityId }}>{children}</Ctx.Provider>;
}

export const useCity = () => useContext(Ctx);

export function CitySelect({ id, className = "" }: { id: string; className?: string }) {
  const { city, setCityId } = useCity();
  return (
    <select
      id={id}
      value={city.id}
      onChange={(e) => setCityId(e.target.value)}
      className={`rounded-lg border border-mist bg-ink px-2.5 py-1.5 text-cream outline-none focus-visible:border-bolt ${className}`}
    >
      {ORIGINS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );
}
