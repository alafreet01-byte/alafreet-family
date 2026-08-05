import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.WEATHER_UNDERGROUND_API_KEY;
  const stationId = process.env.WEATHER_UNDERGROUND_STATION_ID ?? "IALAIN19";
  if (!apiKey) return NextResponse.json({ error: "مفتاح محطة الطقس غير موجود." }, { status: 503 });

  const url = new URL("https://api.weather.com/v2/pws/observations/current");
  url.searchParams.set("stationId", stationId);
  url.searchParams.set("format", "json");
  url.searchParams.set("units", "m");
  url.searchParams.set("numericPrecision", "decimal");
  url.searchParams.set("apiKey", apiKey);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return NextResponse.json({ error: "تعذر جلب بيانات رادار البيت." }, { status: response.status });
  const data = await response.json();
  const observation = data.observations?.[0];
  if (!observation) return NextResponse.json({ error: "لا توجد قراءة حالية للمحطة." }, { status: 404 });
  return NextResponse.json({ stationId, observation });
}
