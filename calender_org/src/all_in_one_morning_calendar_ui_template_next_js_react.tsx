import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, CloudRain, MapPin, Thermometer, Umbrella, Shirt, Coffee, Train, Bus, Bell, Smartphone, Backpack, Sun, Wind } from "lucide-react";
import { useGeolocation } from "./hooks/useGeolocation";
import { useCalendar } from "./hooks/useCalender";
import { usePackItems } from "./hooks/usePackItems";
import { buildOutfit } from "./utils/outfitBuilder";
import { buildItems } from "./utils/packItemsBuilder";
import { OutfitStyleSelector } from "./components/OutfitStyleSelector";
import { ChatButton } from "./components/ChatButton";
import { LocationPicker } from "./components/LocationPicker";
import { WeatherPoint } from "./types/weather";
import { EventItem, TransportMode, TransitETA } from "./types/event";
import { OutfitSuggestion } from "./types/outfit";
import { PackItem } from "./types/packItems";
import { OutfitStyle } from "./types/outfitStyle";
import { MonthCalendar } from "./components/MonthCalendar";
// ---- local cn helper (shadcn不要) ----
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * All-in-one Morning Calendar – WORKING MVP
 * Next.js/React + Tailwind + Framer Motion + lucide-react
 * 依存する外部キーは不要。天気は Open-Meteo を利用（無鍵）。
 * 交通は簡易ETA（徒歩/自転車/直線距離ベース）＋イベントの travelMinutes をフォールバック。
 */

// Types are now imported from @/types/*

// ========= Config (デモ用位置) =========
const HOME = { lat: 35.658034, lon: 139.701636, label: "Shibuya" };
const DEST = { lat: 35.712677, lon: 139.761089, label: "UTokyo Hongo" };

// ========= Helpers =========
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const computeLeaveISO = (event: EventItem, eta: TransitETA) => {
  const start = new Date(event.startISO).getTime();
  const leave = start - (eta.minutes + event.bufferMinutes) * 60 * 1000;
  return new Date(leave).toISOString();
};

const pickWeatherIcon = (w: WeatherPoint["condition"]) => {
  switch (w) {
    case "sunny": return <Sun className="h-5 w-5" />;
    case "rain": return <CloudRain className="h-5 w-5" />;
    case "wind": return <Wind className="h-5 w-5" />;
    default: return <Thermometer className="h-5 w-5" />;
  }
};

// ========= Geo/ETA Utilities =========
const toRad = (d: number) => (d * Math.PI) / 180;
const haversineKm = (a: {lat:number;lon:number}, b: {lat:number;lon:number}) => {
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat); const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat); const la2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
};

function estimateETA(origin:{lat:number;lon:number}, dest:{lat:number;lon:number}, mode: TransportMode): TransitETA {
  const km = haversineKm(origin, dest);
  // 粗い実効速度（都市部ラッシュを考慮した保守値）
  const speedKmh = mode === 'walk' ? 4.5 : mode === 'bike' ? 14 : mode === 'car' ? 22 : 20; // train/busは20相当
  const minutes = Math.max(5, Math.round((km / speedKmh) * 60) + (mode === 'train' || mode === 'bus' ? 10 : 0));
  return { minutes, mode, walkMinutes: mode==='walk'?minutes:undefined, transfers: mode==='train'?1:0, updatedAtISO: new Date().toISOString() };
}

// ========= Weather (Open-Meteo 無鍵) =========
async function fetchWeather(lat:number, lon:number): Promise<WeatherPoint> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('weather fetch failed');
  const j = await res.json();
  const idx = 0; // 今日
  const tempMax = Math.round(j.daily.temperature_2m_max[idx]);
  const tempMin = Math.round(j.daily.temperature_2m_min[idx]);
  const precipitationChance = Math.round(j.daily.precipitation_probability_max[idx] ?? 0);
  const windKmh = Math.round(j.daily.wind_speed_10m_max[idx] ?? 0);
  // 簡易コンディション判定
  const condition: WeatherPoint['condition'] = precipitationChance >= 50 ? 'rain' : (tempMax >= 26 ? 'sunny' : 'cloudy');
  return { dateISO: j.daily.time[idx], condition, tempMin, tempMax, windKmh, precipitationChance };
}
// 予定日の地点・日付の1日予報を取得（Open‑Meteo）
async function fetchWeatherForDate(lat: number, lon: number, dateISO: string): Promise<WeatherPoint> {
  const d = new Date(dateISO).toISOString().slice(0, 10);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto&start_date=${d}&end_date=${d}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('weather fetch failed');
  const j = await res.json();
  const tempMax = Math.round(j.daily.temperature_2m_max[0]);
  const tempMin = Math.round(j.daily.temperature_2m_min[0]);
  const precipitationChance = Math.round(j.daily.precipitation_probability_max[0] ?? 0);
  const windKmh = Math.round(j.daily.wind_speed_10m_max[0] ?? 0);
  const condition: WeatherPoint['condition'] = precipitationChance >= 50 ? 'rain' : (tempMax >= 26 ? 'sunny' : 'cloudy');
  return { dateISO: d, condition, tempMin, tempMax, windKmh, precipitationChance };
}

// buildOutfit and buildItems are now imported from @/utils/*

// ========= Demo Event =========
const demoEvent: EventItem = {
  id: 'ev1',
  title: '研究室ミーティング',
  startISO: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
  endISO: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
  place: '東京大学（本郷）',
  lat: DEST.lat, lon: DEST.lon,
  bufferMinutes: 10,
  mode: 'train',
};

// ========= Hooks =========
function useMorningData(
  homeLocation: { lat: number; lon: number },
  currentEvent: EventItem,
  userItems: { essentials: PackItem[]; personal: PackItem[] },
  outfitStyle: OutfitStyle
) {
  const [weather, setWeather] = useState<WeatherPoint | null>(null);
  const [event, setEvent] = useState<EventItem>(currentEvent);
  const [eta, setEta] = useState<TransitETA | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eventWeather, setEventWeather] = useState<WeatherPoint | null>(null);

  // Update event when currentEvent changes
  useEffect(() => {
    setEvent(currentEvent);
  }, [currentEvent]);

  // Weather
  useEffect(() => {
    let mounted = true;
    fetchWeather(homeLocation.lat, homeLocation.lon).then(w => { if (mounted) setWeather(w); }).catch(() => {
      // フォールバック（ネット無し等）
      if (mounted) setWeather({ dateISO: new Date().toISOString().slice(0,10), condition: 'rain', tempMin: 13, tempMax: 18, precipitationChance: 70, windKmh: 14 });
    });
    return () => { mounted = false; };
  }, [homeLocation]);

  useEffect(() => {
    let mounted = true;
    const lat = event.lat ?? DEST.lat;
    const lon = event.lon ?? DEST.lon;
    fetchWeatherForDate(lat, lon, event.startISO)
      .then(w => { if (mounted) setEventWeather(w); })
      .catch(() => setEventWeather(null));
    return () => { mounted = false; };
  }, [event]);

  // ETA（簡易推定）
  useEffect(() => {
    try {
      const e = estimateETA(homeLocation, { lat: event.lat ?? DEST.lat, lon: event.lon ?? DEST.lon }, event.mode);
      setEta(e);
    } catch (e:any) {
      setError(e?.message ?? 'ETA error');
      setEta({ minutes: event.travelMinutes ?? 35, mode: event.mode, updatedAtISO: new Date().toISOString() });
    }
  }, [event, homeLocation]);

  const outfit = useMemo(() => weather ? buildOutfit(weather, { style: outfitStyle }) : null, [weather, outfitStyle]);
  const items = useMemo(() => weather ? buildItems(weather, event, userItems) : [], [weather, event, userItems]);
  const leaveISO = useMemo(() => (weather && eta) ? computeLeaveISO(event, eta) : null, [event, weather, eta]);

  return { weather, event, eta, outfit, items, leaveISO, error, eventWeather } as const;
}

// ========= UI Primitives =========
const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("rounded-2xl shadow-sm border border-zinc-200 bg-white p-4", className)}>{children}</div>
);

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-2 text-zinc-700 font-semibold">
    {icon}
    <h3 className="text-sm tracking-wide uppercase">{title}</h3>
  </div>
);

const Pill = ({children}: {children: React.ReactNode}) => (
  <span className="px-2 py-1 text-xs rounded-full border bg-zinc-50">{children}</span>
);

// ========= Feature Cards =========
const WeatherCard: React.FC<{ weather: WeatherPoint }> = ({ weather }) => (
  <Card className="col-span-12 md:col-span-4">
    <SectionTitle icon={<Thermometer className="h-4 w-4" />} title="今日の天気" />
    <div className="mt-3 flex items-end justify-between">
      <div>
        <div className="text-4xl font-bold">{weather.tempMax}°<span className="text-xl align-top">/{weather.tempMin}°</span></div>
        <div className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
          {pickWeatherIcon(weather.condition)}
          <span>降水 {weather.precipitationChance}% ・ 風 {weather.windKmh ?? '-'}km/h</span>
        </div>
      </div>
      <motion.div initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} className="flex items-center gap-2">
        {weather.precipitationChance >= 50 && <Pill><Umbrella className="h-3 w-3 inline mr-1"/>傘推奨</Pill>}
        {weather.tempMax <= 16 && <Pill>薄手アウター</Pill>}
      </motion.div>
    </div>
  </Card>
);

const NextEventCard: React.FC<{ event: EventItem; eta: TransitETA | null; leaveISO: string | null }> = ({ event, eta, leaveISO }) => (
  <Card className="col-span-12 md:col-span-8">
    <SectionTitle icon={<Calendar className="h-4 w-4" />} title="次の予定" />
    <div className="mt-3 grid grid-cols-12 gap-3 items-center">
      <div className="col-span-12 md:col-span-7">
        <div className="text-lg font-semibold">{event.title}</div>
        <div className="text-sm text-zinc-600 mt-1 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{fmtTime(event.startISO)} - {fmtTime(event.endISO)}</span>
        </div>
        <div className="text-sm text-zinc-600 mt-1 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{event.place}</span>
        </div>
      </div>
      <div className="col-span-12 md:col-span-5">
        <div className="rounded-xl bg-zinc-50 p-3 border">
          <div className="text-xs text-zinc-500">出発推奨</div>
          <div className="text-2xl font-bold mt-1">{leaveISO ? fmtTime(leaveISO) : '---'}</div>
          <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
            {(eta?.mode ?? event.mode) === "train" ? <Train className="h-4 w-4"/> : <Bus className="h-4 w-4"/>}
            <span>所要 {eta?.minutes ?? event.travelMinutes ?? 35}分 + 余裕 {event.bufferMinutes}分</span>
          </div>
        </div>
      </div>
    </div>
  </Card>
);

const OutfitCard: React.FC<{ outfit: OutfitSuggestion }> = ({ outfit }) => (
  <Card className="col-span-12 md:col-span-6">
    <SectionTitle icon={<Shirt className="h-4 w-4" />} title="服装提案" />
    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
      <div>
        <div className="text-zinc-500">トップス</div>
        <div className="font-medium">{outfit.tops}</div>
      </div>
      <div>
        <div className="text-zinc-500">ボトムス</div>
        <div className="font-medium">{outfit.bottoms}</div>
      </div>
      <div>
        <div className="text-zinc-500">アウター</div>
        <div className="font-medium">{outfit.outer ?? "不要"}</div>
      </div>
      <div>
        <div className="text-zinc-500">シューズ</div>
        <div className="font-medium">{outfit.shoes}</div>
      </div>
    </div>
    {outfit.notes && <div className="mt-2 text-xs text-zinc-600">{outfit.notes}</div>}
  </Card>
);

const ItemsCard: React.FC<{ items: PackItem[] }> = ({ items }) => (
  <Card className="col-span-12 md:col-span-6">
    <SectionTitle icon={<Backpack className="h-4 w-4" />} title="持ち物提案" />
    <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      {items.map((it, idx) => (
        <li key={idx} className={cn("flex items-center gap-2 p-2 rounded-lg border", it.required ? "bg-amber-50 border-amber-200" : "bg-zinc-50")}> 
          <span className="inline-flex h-2.5 w-2.5 rounded-full mt-0.5" style={{ background: it.required ? "#f59e0b" : "#d4d4d8" }} />
          <span className="font-medium">{it.name}</span>
          {it.reason && <span className="text-xs text-zinc-500 ml-auto">{it.reason}</span>}
        </li>
      ))}
    </ul>
  </Card>
);

const QuickActions: React.FC<{ onSnooze: () => void; onOpenTransit: () => void; onVoiceAdd: () => void }> = ({ onSnooze, onOpenTransit, onVoiceAdd }) => (
  <Card className="col-span-12">
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={onOpenTransit} className="px-3 py-2 rounded-xl bg-black text-white flex items-center gap-2">
        <Train className="h-4 w-4"/> 現在の最速ルート（デモ）
      </button>
      <button onClick={onSnooze} className="px-3 py-2 rounded-xl border flex items-center gap-2">
        <Bell className="h-4 w-4"/> 出発リマインド +5分（デモ）
      </button>
      <button onClick={onVoiceAdd} className="px-3 py-2 rounded-xl border flex items-center gap-2">
        <Smartphone className="h-4 w-4"/> 音声で予定追加（デモ）
      </button>
    </div>
  </Card>
);

// ========= Header =========
const Header: React.FC<{ city: string; locationLabel?: string | null }> = ({ city, locationLabel }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-10 w-10 rounded-2xl bg-black text-white grid place-items-center">
        <Coffee className="h-5 w-5" />
      </motion.div>
      <div>
        <div className="text-xs text-zinc-500">Good Morning</div>
        <div className="text-lg font-bold">今日の準備を完了しましょう</div>
      </div>
    </div>
    <div className="text-sm text-zinc-500">{locationLabel ?? city} ・ {new Date().toLocaleDateString()} ・ {new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}</div>
  </div>
);

// ========= Dev Tests =========
function runDevTests() {
  try {
    // Case 1: 通常ケース 9:00開始、ETA35 + 余裕10 → 8:15
    const ev1: EventItem = { id:'t', title: 't', startISO: '2025-01-01T09:00:00.000Z', endISO: '2025-01-01T10:00:00.000Z', place:'p', bufferMinutes:10, mode:'train' };
    const eta1: TransitETA = { minutes: 35, mode: 'train', updatedAtISO: '2025-01-01T00:00:00.000Z' };
    const l1 = new Date(computeLeaveISO(ev1, eta1));
    console.assert(l1.getUTCHours() === 8 && l1.getUTCMinutes() === 15, 'Test1 failed: expected 08:15Z');

    // Case 2: 余裕0 → 8:25Z
    const ev2: EventItem = { ...ev1, bufferMinutes: 0 };
    const l2 = new Date(computeLeaveISO(ev2, eta1));
    console.assert(l2.getUTCHours() === 8 && l2.getUTCMinutes() === 25, 'Test2 failed: expected 08:25Z');

    // Case 3: 長距離（ETA105 + 余裕0）→ 7:15Z
    const eta3: TransitETA = { minutes: 105, mode: 'train', updatedAtISO: '2025-01-01T00:00:00.000Z' };
    const l3 = new Date(computeLeaveISO(ev2, eta3));
    console.assert(l3.getUTCHours() === 7 && l3.getUTCMinutes() === 15, 'Test3 failed: expected 07:15Z');

    // Haversine smoke
    const km = haversineKm({lat:0,lon:0},{lat:0,lon:1});
    console.assert(km > 100, 'Haversine smoke');

    // Component exists
    console.assert(typeof MorningDashboard === 'function', 'Component exists');
  } catch (e) {
    console.error('[DevTests] failed', e);
  }
}
if (typeof window !== 'undefined') runDevTests();

// ========= Page =========
export default function MorningDashboard() {
  const { location, error: geoError, loading: geoLoading, setManualLocation } = useGeolocation();
  const { events, addEvent, getNextEvent, removeEvent: removeCalendarEvent } = useCalendar();
  const { userItems } = usePackItems();
  const [outfitStyle, setOutfitStyle] = useState<OutfitStyle>('casual');

  const homeLocation = location ?? HOME;
  const nextEvent = getNextEvent() ?? demoEvent;
  const { weather, event, eta, outfit, items, leaveISO, error, eventWeather } = useMorningData(
    homeLocation,
    nextEvent,
    userItems,
    outfitStyle
  );

  const handleEventAdded = (newEvent: EventItem) => {
    addEvent(newEvent);
  };
  const removeEvent = (id: string) => {
    removeCalendarEvent(id);
  };
  const handleRemoveEvent = (id: string) => {
    removeCalendarEvent(id);
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-zinc-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Header city="Tokyo" locationLabel={location?.label} />
        <LocationPicker
          locationLabel={location?.label}
          loading={geoLoading}
          error={geoError}
          onManualSet={(lat, lon, label) => setManualLocation({ lat, lon, label })}
        />

        {/* Hero */}
        <motion.div initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} className="mt-6 rounded-3xl p-5 bg-[radial-gradient(ellipse_at_top_left,rgba(0,0,0,0.04),rgba(0,0,0,0))] border">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 md:col-span-8">
              <div className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                <Clock className="h-6 w-6"/>
                {leaveISO ? '今出れば余裕で間に合います' : '読み込み中…'}
              </div>
              <div className="text-zinc-600 mt-2">
                {weather ? (
                  <> {weather.precipitationChance >= 50 ? <>雨の予報です。<strong>折り畳み傘</strong>と<strong>薄手ジャケット</strong>を。</> : <>降水確率は低め。身軽でOK。</>} </>
                ) : '天気を取得しています…'}
              </div>
              {event && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill><Calendar className="h-3 w-3 inline mr-1"/> {fmtTime(event.startISO)} 開始</Pill>
                  <Pill><Clock className="h-3 w-3 inline mr-1"/> 出発 {leaveISO ? fmtTime(leaveISO) : '---'}</Pill>
                  <Pill><MapPin className="h-3 w-3 inline mr-1"/> {event.place}</Pill>
                </div>
              )}
              {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
            </div>
            <div className="col-span-12 md:col-span-4 flex justify-end">
              <div className="rounded-2xl border p-4 bg-white w-full md:w-64">
                <div className="text-xs text-zinc-500">予定の概況</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-3xl font-bold">{ eventWeather ? eventWeather.tempMax : '--'}°</div>
                  <div className="text-sm text-zinc-600 flex items-center gap-2">{eventWeather ? pickWeatherIcon(eventWeather.condition) : <Thermometer className="h-5 w-5"/>}<span>{eventWeather ? eventWeather.condition : '---'}</span></div>
                </div>
                <div className="mt-2 text-xs text-zinc-500">降水 {eventWeather?.precipitationChance ?? '--'}% ・ 風 {eventWeather?.windKmh ?? '--'}km/h</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-12 gap-4">
          {weather && <WeatherCard weather={weather} />}
          <NextEventCard event={event} eta={eta} leaveISO={leaveISO} />
          {outfit && (
            <>
              <OutfitCard outfit={outfit} />
              <Card className="col-span-12 md:col-span-6">
                <SectionTitle icon={<Shirt className="h-4 w-4" />} title="スタイル選択" />
                <div className="mt-3">
                  <OutfitStyleSelector currentStyle={outfitStyle} onStyleChange={setOutfitStyle} />
                </div>
              </Card>
            </>
          )}
          <ItemsCard items={items} />
          <QuickActions
            onOpenTransit={() => alert(`デモ: 推定ETA ${eta?.minutes ?? '---'} 分（${eta?.mode ?? event.mode}）`)}
            onSnooze={() => alert('デモ: 通知を+5分スヌーズします（実装時はPushへ）')}
            onVoiceAdd={() => {}}
          />
        </div>

        {/* Chat Button */}
        <ChatButton onEventAdded={handleEventAdded} />
        <Card className="col-span-12">
          <SectionTitle icon={<Calendar className="h-4 w-4" />} title="カレンダー" />
          <div className="mt-3">
            <MonthCalendar events={events} onRemove={handleRemoveEvent} />
          </div>
        </Card>
        {/* Footer */}
        <div className="text-center text-xs text-zinc-400 mt-6">© All-in-one Morning Calendar – Working MVP (Open-Meteo)</div>
      </div>
    </div>
  );
}
