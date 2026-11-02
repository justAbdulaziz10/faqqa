import { getRadar } from "@/lib/radar";
import { fail } from "@/lib/http";
import { arDate } from "@/lib/format";
import { SITE } from "@/lib/site";

// A calendar file for an area's expected truffle window, with a reminder two days before it opens.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let radar;
  try {
    radar = await getRadar();
  } catch {
    return fail(502, "climate_unavailable", "تعذر جلب بيانات المناخ الآن. حاول بعد قليل.");
  }
  const area = radar.areas.find((a) => a.id === id);
  if (!area) return fail(404, "unknown_area", "ما لقينا هالمنطقة.");
  if (!area.emergenceWindow) return fail(404, "no_window", "ما نزل على هالمنطقة مطر كافي للحين، فما فيه موعد نذكرك فيه.");

  const { from, to } = area.emergenceWindow;
  const ymd = (iso: string) => iso.slice(0, 10).replaceAll("-", "");
  const end = new Date(`${to.slice(0, 10)}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1); // DTEND is exclusive for all-day events
  const link = `${SITE.url}/?area=${area.id}#radar`;
  const description = [
    `فرصة الفقع متوقعة في ${area.name} (${area.region}) بين ${arDate(from)} و${arDate(to)}.`,
    `مطر الوسم: ${area.wasmRain} ملم.`,
    `خذني لها: https://www.google.com/maps/dir/?api=1&destination=${area.lat},${area.lon}`,
    `آخر تحديث للتوقع: ${link}`,
  ].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Faqqa//AR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${area.id}-${ymd(from)}@faqqa.vercel.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${ymd(from)}`,
    `DTEND;VALUE=DATE:${ymd(end.toISOString())}`,
    `SUMMARY:${esc(`موسم الفقع في ${area.name}`)}`,
    `LOCATION:${esc(`${area.name}، ${area.region}`)}`,
    `GEO:${area.lat};${area.lon}`,
    `DESCRIPTION:${esc(description)}`,
    `URL:${link}`,
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`بعد يومين يبدأ موسم الفقع في ${area.name}`)}`,
    "TRIGGER:-P2D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(lines.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="faqqa-${area.id}.ics"`,
      "cache-control": "public, s-maxage=10800, stale-while-revalidate=86400",
    },
  });
}

/** Escapes text values per RFC 5545. */
function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Folds lines longer than 75 octets, without splitting a UTF-8 character. */
function fold(line: string) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let cur = "";
  for (const ch of line) {
    const limit = parts.length ? 74 : 75; // continuation lines start with a space
    if (enc.encode(cur + ch).length > limit) { parts.push(cur); cur = ch; } else cur += ch;
  }
  parts.push(cur);
  return parts.join("\r\n ");
}
