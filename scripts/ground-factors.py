"""Measures the slow-changing ground around each truffle area and writes src/data/ground.json.

Run once a season (needs network): python3 -I scripts/ground-factors.py
Requires numpy, tifffile and Pillow. Writes measurements only; src/lib/ground.ts turns them into scores.

Sources:
- Soil: ISRIC SoilGrids 2.0 (250 m), WCS. Sand, clay and pH (H2O), 0-15 cm, median over about 20 x 20 km.
- Host plant: MODIS MOD13Q1 NDVI (250 m) via the ORNL DAAC web service. For each spring (Feb 18 to
  Apr 6) of 2021-2025, the median NDVI over about 17 x 17 km at the greenest composite, ignoring
  pixels above 0.4 (irrigated farms); then the median across years. Spring green-up of the natural
  cover is a proxy for the perennial dwarf shrubs, رقروق (Helianthemum) among them, that host
  truffles. GBIF was tried and rejected: 97% of its Saudi Helianthemum records come from one
  survey, so a missing record says nothing about a missing plant.
- Grazing: FAO Gridded Livestock of the World 4 (2015, CC0), sheep and goats per km², mean over
  about 50 x 50 km. GLW has no camel layer, so camel grazing is not counted.
"""

import io
import json
import os
import re
import statistics
import sys
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
import urllib.request
from datetime import date

import numpy as np
import tifffile
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # the global livestock grids are 4320 x 2160

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.environ.get("GLW_CACHE", "/tmp/glw")
GLW = {"sheep": 6769626, "goats": 6769696}  # Harvard Dataverse file ids (heads per 5-arc-minute cell)
YEARS = range(2021, 2026)


def get(url, timeout=90):
    req = urllib.request.Request(url, headers={"user-agent": "faqqa-ground/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def read_areas():
    src = open(os.path.join(ROOT, "src/lib/areas.ts"), encoding="utf-8").read()
    src = src[src.index("export const AREAS"):]
    src = src[:src.index("];")]  # only the truffle areas, not the user's origin cities
    rows = re.findall(r'id: "([a-z]+)".*?lat: ([\d.]+), lon: ([\d.]+)', src)
    if not rows:
        sys.exit("no areas found in src/lib/areas.ts")
    return [(i, float(la), float(lo)) for i, la, lo in rows]


def soil(prop, lat, lon, half=0.1):
    vals = []
    for depth in ("0-5cm", "5-15cm"):
        q = urllib.parse.urlencode([
            ("map", f"/map/{prop}.map"), ("SERVICE", "WCS"), ("VERSION", "2.0.1"), ("REQUEST", "GetCoverage"),
            ("COVERAGEID", f"{prop}_{depth}_mean"), ("FORMAT", "image/tiff"),
            ("SUBSET", f"long({lon - half},{lon + half})"), ("SUBSET", f"lat({lat - half},{lat + half})"),
            ("SUBSETTINGCRS", "http://www.opengis.net/def/crs/EPSG/0/4326"),
            ("OUTPUTCRS", "http://www.opengis.net/def/crs/EPSG/0/4326"),
        ])
        a = tifffile.imread(io.BytesIO(get(f"https://maps.isric.org/mapserv?{q}"))).astype(float)
        a = a[a > 0]  # 0 and negatives are no-data over rock, water and outside the model
        if a.size:
            vals.append(float(np.median(a)))
    return round(sum(vals) / len(vals) / 10, 1) if vals else None  # g/kg -> %, pH*10 -> pH


def spring_ndvi(lat, lon):
    peaks = []
    for y in YEARS:
        q = urllib.parse.urlencode({"latitude": lat, "longitude": lon, "band": "250m_16_days_NDVI",
                                    "startDate": f"A{y}049", "endDate": f"A{y}097", "kmAboveBelow": 8, "kmLeftRight": 8})
        data = json.loads(get(f"https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset?{q}", timeout=180))
        meds = []
        for comp in data["subset"]:
            px = [v * 0.0001 for v in comp["data"] if -2000 < v < 4000]  # drop fill and irrigated fields
            if len(px) > 50:
                meds.append(statistics.median(px))
        if meds:
            peaks.append(max(meds))
    return round(statistics.median(peaks), 3) if peaks else None


def glw():
    os.makedirs(CACHE, exist_ok=True)
    out = {}
    for name, fid in GLW.items():
        path = os.path.join(CACHE, f"{fid}.tif")
        if not os.path.exists(path):
            open(path, "wb").write(get(f"https://dataverse.harvard.edu/api/access/datafile/{fid}", timeout=600))
        a = np.array(Image.open(path), dtype=float)  # LZW float32; Pillow decodes it without imagecodecs
        a[a < 0] = np.nan  # no-data is a huge negative
        out[name] = a
    return out


def cell_km2(lat_top, rows, res):
    """Area of each 5-arc-minute row, from the spherical zone formula."""
    r = 6371.0
    tops = np.radians(lat_top - res * np.arange(rows))
    return r * r * np.radians(res) * (np.sin(tops) - np.sin(tops - np.radians(res)))


def grazing(rasters, lat, lon, half=0.25):
    res = 1 / 12  # 5 arc-minutes, origin at (-180, 90)
    r0, r1 = int((90 - (lat + half)) / res), int((90 - (lat - half)) / res) + 1
    c0, c1 = int((lon - half + 180) / res), int((lon + half + 180) / res) + 1
    heads = rasters["sheep"][r0:r1, c0:c1] + rasters["goats"][r0:r1, c0:c1]
    km2 = np.repeat(cell_km2(90 - r0 * res, r1 - r0, res)[:, None], c1 - c0, axis=1)
    ok = ~np.isnan(heads)
    return round(float(heads[ok].sum() / km2[ok].sum()), 1) if ok.any() else None


def measure(area, rasters):
    aid, lat, lon = area
    row = {
        "sand": soil("sand", lat, lon),
        "clay": soil("clay", lat, lon),
        "ph": soil("phh2o", lat, lon),
        "springNdvi": spring_ndvi(lat, lon),
        "livestock": grazing(rasters, lat, lon),
    }
    print(aid, row, flush=True)
    return aid, row


def main():
    areas = read_areas()
    rasters = glw()
    with ThreadPoolExecutor(4) as pool:  # four at a time keeps us polite to the free services
        result = dict(pool.map(lambda a: measure(a, rasters), areas))
    doc = {
        "measuredAt": date.today().isoformat(),
        "sources": {
            "soil": "ISRIC SoilGrids 2.0, 0-15 cm, median over ~20x20 km",
            "host": "MODIS MOD13Q1 NDVI, spring peak (Feb 18 to Apr 6), median of 2021-2025 over ~17x17 km, farms excluded",
            "grazing": "FAO Gridded Livestock of the World 4 (2015), sheep + goats per km² over ~50x50 km; no camel layer",
        },
        "areas": result,
    }
    with open(os.path.join(ROOT, "src/data/ground.json"), "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")


if __name__ == "__main__":
    main()
