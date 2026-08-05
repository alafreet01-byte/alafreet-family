import { NextResponse } from "next/server";

const QURAN_API = "https://api.alquran.cloud/v1";
const PRAYER_API = "https://api.aladhan.com/v1";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const surah = Number(url.searchParams.get("surah") || 0);

  try {
    const [quranResponse, prayerResponse, weatherResponse] = await Promise.all([
      fetch(surah ? `${QURAN_API}/surah/${surah}/quran-uthmani` : `${QURAN_API}/surah`, { next: { revalidate: 86400 } }),
      fetch(`${PRAYER_API}/timingsByCity?city=Al%20Ain&country=United%20Arab%20Emirates&method=16`, { next: { revalidate: 3600 } }),
      fetch("https://api.open-meteo.com/v1/forecast?latitude=24.0583&longitude=55.7772&elevation=1240&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FDubai", { next: { revalidate: 900 } }),
    ]);

    if (!quranResponse.ok) throw new Error("تعذر تحميل القرآن الكريم.");
    const quran = await quranResponse.json();
    const prayer = prayerResponse.ok ? await prayerResponse.json() : null;
    const weather = weatherResponse.ok ? await weatherResponse.json() : null;

    return NextResponse.json({ quran: quran.data, prayer: prayer?.data ?? null, weather });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر تحميل البيانات." }, { status: 502 });
  }
}
