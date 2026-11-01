import { NextResponse } from "next/server";
import { buildRadar } from "@/lib/radar";
import { fail } from "@/lib/http";

export const revalidate = 10800; // 3h — climate data updates a few times a day

export async function GET() {
  try {
    const radar = await buildRadar();
    return NextResponse.json({ ok: true, radar }, { headers: { "cache-control": "public, s-maxage=10800, stale-while-revalidate=86400" } });
  } catch (err) {
    console.error("[radar]", err);
    return fail(502, "climate_unavailable", "تعذر جلب بيانات المناخ الآن. حاول بعد قليل.");
  }
}
