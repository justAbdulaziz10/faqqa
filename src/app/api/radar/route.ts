import { NextResponse } from "next/server";
import { getRadar } from "@/lib/radar";
import { fail } from "@/lib/http";


export async function GET() {
  try {
    const radar = await getRadar();
    return NextResponse.json({ ok: true, radar }, { headers: { "cache-control": "public, s-maxage=10800, stale-while-revalidate=86400" } });
  } catch (err) {
    console.error("[radar]", err);
    return fail(502, "climate_unavailable", "تعذر جلب بيانات المناخ الآن. حاول بعد قليل.");
  }
}
