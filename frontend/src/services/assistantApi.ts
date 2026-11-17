/**
 * Warstwa serwisu Asystenta AI.
 *
 * Sygnatury i typy są kontraktem pod przyszły backend (.NET 8 + OpenAI Structured Outputs).
 * Na razie obie funkcje to „inteligentny mock”: realistyczne opóźnienie + deterministyczne
 * algorytmy na prawdziwych współrzędnych. Przy podpinaniu backendu wystarczy podmienić
 * ciała funkcji na `fetch` – komponenty nie wymagają zmian.
 */
import { DAY_COLORS, DEFAULT_TOTAL_BUDGET } from '../lib/constants';
import { generateTripDays } from '../lib/dates';
import { centroid, distanceKm, routeLengthKm, sortByNearestNeighbor, type LatLng } from '../lib/geo';
import { geocodeAddress } from '../lib/geocoding';
import {
  INTEREST_IDS,
  INTEREST_LABELS,
  findCuratedCity,
  type Attraction,
  type InterestId,
} from '../mocks/attractions';
import type { ScheduleItem, Trip, TripDay } from '../types/trip';

export type TripPace = 'relaxed' | 'balanced' | 'intensive';

export interface GenerateTripPlanParams {
  destination: string;
  /** Data w formacie 'YYYY-MM-DD'. */
  startDate: string;
  /** Data w formacie 'YYYY-MM-DD'. */
  endDate: string;
  /** Orientacyjny budżet na miejscu; gdy brak – `DEFAULT_TOTAL_BUDGET`. */
  budget?: number;
  /** Kod waluty ISO 4217. */
  currency: string;
  pace: TripPace;
  /** Identyfikatory zainteresowań (zob. `InterestId`); puste = wszystkie. */
  interests: string[];
  /** Z kim podróżuje użytkownik, np. „Rodzinnie”, „Ze znajomymi” lub własny opis. */
  companion?: string;
  /** Dodatkowe życzenia w wolnym tekście, np. „mniej chodzenia”, „bez porannego pośpiechu”. */
  notes?: string;
  /** Współrzędne celu – gdy brak, mock geokoduje `destination`. */
  lat?: number;
  lng?: number;
}

export interface AskTripAssistantParams {
  trip: Trip;
  activeDayId: string;
  prompt: string;
}

export interface AskTripAssistantResult {
  message: string;
  suggestedItems?: ScheduleItem[];
  reorderedDayItems?: ScheduleItem[];
}

export const PACE_CONFIG: Record<TripPace, { itemsPerDay: number; spacingMin: number; startHour: number }> = {
  relaxed: { itemsPerDay: 2, spacingMin: 180, startHour: 10 },
  balanced: { itemsPerDay: 3, spacingMin: 150, startHour: 9.5 },
  intensive: { itemsPerDay: 5, spacingMin: 105, startHour: 9 },
};

// --- Pomocnicze ---

const wait = (min: number, max: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));

const simulateLatency = () => wait(800, 1200);

let idCounter = 0;
const newItemId = () => `ai-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

const formatTime = (minutes: number): string => {
  const m = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

const parseTime = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return (Number.isFinite(h) ? h : 12) * 60 + (Number.isFinite(m) ? m : 0);
};

const toScheduleItem = (spot: Attraction, time: string): ScheduleItem => ({
  id: newItemId(),
  title: spot.title,
  time,
  type: 'activity',
  lat: spot.lat,
  lng: spot.lng,
  cost: spot.cost,
});

const GENERIC_TEMPLATES: Record<InterestId, { title: string; cost: number }[]> = {
  monuments: [
    { title: 'Stare Miasto – spacer', cost: 0 },
    { title: 'Główny kościół lub katedra', cost: 15 },
    { title: 'Zamek lub pałac', cost: 40 },
    { title: 'Główny plac miejski', cost: 0 },
  ],
  food: [
    { title: 'Lokalna restauracja – lunch', cost: 70 },
    { title: 'Targ lub hala targowa', cost: 40 },
    { title: 'Kawiarnia z widokiem', cost: 30 },
    { title: 'Kolacja w kuchni regionalnej', cost: 100 },
  ],
  nature: [
    { title: 'Park miejski', cost: 0 },
    { title: 'Ogród botaniczny', cost: 20 },
    { title: 'Nabrzeże – spacer', cost: 0 },
    { title: 'Punkt widokowy', cost: 0 },
  ],
  museums: [
    { title: 'Muzeum miejskie', cost: 30 },
    { title: 'Galeria sztuki', cost: 35 },
    { title: 'Muzeum historii regionu', cost: 25 },
    { title: 'Centrum nauki', cost: 40 },
  ],
  nightlife: [
    { title: 'Bary w centrum', cost: 70 },
    { title: 'Klub muzyczny', cost: 60 },
    { title: 'Dzielnica barowa', cost: 70 },
    { title: 'Taras z koktajlami', cost: 80 },
  ],
};

/** Punkty rozmieszczone spiralą wokół `center` (do ~4 km) dla miast bez ręcznej listy atrakcji. */
const generateGenericSpots = (
  center: LatLng,
  cityName: string,
  count: number,
  categories: InterestId[],
  startIndex = 0,
): Attraction[] => {
  const GOLDEN_ANGLE = 2.399963;
  const cats = categories.length > 0 ? categories : INTEREST_IDS;
  return Array.from({ length: count }).map((_, k) => {
    const idx = startIndex + k;
    const category = cats[idx % cats.length];
    const templates = GENERIC_TEMPLATES[category];
    const tpl = templates[Math.floor(idx / cats.length) % templates.length];
    const angle = idx * GOLDEN_ANGLE;
    const radiusKm = 0.6 + (idx % 6) * 0.65;
    return {
      title: `${tpl.title} – ${cityName}`,
      category,
      cost: tpl.cost,
      lat: center.lat + (radiusKm * Math.cos(angle)) / 111,
      lng: center.lng + (radiusKm * Math.sin(angle)) / (111 * Math.max(0.2, Math.cos((center.lat * Math.PI) / 180))),
    };
  });
};

const toInterestIds = (raw: string[]): InterestId[] =>
  raw.filter((x): x is InterestId => (INTEREST_IDS as string[]).includes(x));

const shortCityName = (destination: string) => destination.split(',')[0].trim() || destination;

// --- generateTripPlan ---

/** Generuje harmonogram dni z atrakcjami i współrzędnymi dla podanego celu. */
export async function generateTripPlan(params: GenerateTripPlanParams): Promise<TripDay[]> {
  const latencyPromise = simulateLatency();

  let center: LatLng | null =
    params.lat != null && params.lng != null && Number.isFinite(params.lat) && Number.isFinite(params.lng)
      ? { lat: params.lat, lng: params.lng }
      : null;
  if (!center) {
    const place = await geocodeAddress(params.destination).catch(() => null);
    if (place) center = { lat: place.lat, lng: place.lng };
  }
  if (!center) throw new Error('Nie udało się ustalić lokalizacji celu podróży.');

  const days = generateTripDays(params.startDate, params.endDate);
  if (days.length === 0) throw new Error('Nieprawidłowy zakres dat podróży.');

  const base = PACE_CONFIG[params.pace] ?? PACE_CONFIG.balanced;
  let { itemsPerDay, startHour } = base;
  const { spacingMin } = base;

  // Towarzystwo i życzenia w wolnym tekście modyfikują tempo oraz dobór miejsc
  const companion = params.companion ?? '';
  const notes = params.notes ?? '';
  const isFamily = /rodzin|dzieci/i.test(companion);
  const wantsSlower = isFamily || /mniej chodz|spokojn|bez presji|bez pośpiech|bez pospiech|luz/i.test(notes);
  const wantsLateStart = /poranne|rano|pośpiech|pospiech|późn|pozn|wyspa/i.test(notes);
  const avoidNightlife = isFamily || /bez (bar|klub|nocn|imprez|alkohol)/i.test(notes);
  if (wantsSlower) itemsPerDay = Math.max(2, itemsPerDay - 1);
  if (wantsLateStart) startHour = Math.max(startHour, 10.5);

  const allowedCategories = INTEREST_IDS.filter((c) => !(avoidNightlife && c === 'nightlife'));
  const interests = toInterestIds(params.interests).filter((c) => allowedCategories.includes(c));
  const cityName = shortCityName(params.destination);
  const needed = days.length * itemsPerDay;

  const curated = findCuratedCity(center);
  const pool: Attraction[] = curated ? curated.attractions.filter((a) => allowedCategories.includes(a.category)) : [];
  if (pool.length < needed) {
    const genericCategories = interests.length > 0 ? interests : allowedCategories;
    pool.push(...generateGenericSpots(center, cityName, needed - pool.length + itemsPerDay, genericCategories, pool.length));
  }

  // Skala kosztów: łączny koszt atrakcji nie powinien przekraczać ~60% budżetu
  const budget = params.budget != null && Number.isFinite(params.budget) && params.budget > 0 ? params.budget : DEFAULT_TOTAL_BUDGET;
  const costScale = (spots: Attraction[]) => {
    const total = spots.reduce((s, x) => s + x.cost, 0);
    return total > 0 ? Math.min(1, (budget * 0.6) / total) : 1;
  };

  const used = new Set<Attraction>();
  const planned: Attraction[][] = [];

  days.forEach((_, dayIdx) => {
    const unused = pool.filter((p) => !used.has(p));
    const preferred = interests.length > 0 ? unused.filter((p) => interests.includes(p.category)) : unused;
    // Zaczynamy od preferowanej kategorii (rotacja po dniach), by dni były zróżnicowane
    const seedPool = preferred.length > 0 ? preferred : unused;
    const rotation = interests.length > 0 ? interests : allowedCategories;
    const wanted = rotation[dayIdx % rotation.length];
    const seed = seedPool.find((p) => p.category === wanted) ?? seedPool[0];
    if (!seed) {
      planned.push([]);
      return;
    }

    const rest = [...preferred, ...unused.filter((p) => !preferred.includes(p))]
      .filter((p) => p !== seed)
      .sort((x, y) => distanceKm(seed, x) - distanceKm(seed, y))
      .slice(0, itemsPerDay - 1);

    const picked = [seed, ...rest];
    const night = picked.filter((p) => p.category === 'nightlife');
    const daytime = sortByNearestNeighbor(picked.filter((p) => p.category !== 'nightlife'));
    picked.forEach((p) => used.add(p));
    planned.push([...daytime, ...night]);
  });

  const scale = costScale(planned.flat());

  await latencyPromise;

  return days.map((day, i) => {
    const spots = planned[i];
    const labels = [...new Set(spots.map((s) => INTEREST_LABELS[s.category]))].slice(0, 2);
    return {
      ...day,
      color: DAY_COLORS[i % DAY_COLORS.length],
      customTitle: labels.join(' · '),
      items: spots.map((spot, k) => {
        const isNight = spot.category === 'nightlife';
        const minutes = isNight ? Math.max(20.5 * 60, startHour * 60 + k * spacingMin) : startHour * 60 + k * spacingMin;
        return toScheduleItem({ ...spot, cost: Math.round(spot.cost * scale) }, formatTime(minutes));
      }),
    };
  });
}

// --- askTripAssistant ---

const OPTIMIZE_RE = /optymal|kolejn|tras[aęe]|sortuj|posortuj|uporządk|uporzadk|przeorganiz|skróć|skroc|reorder|optimi[sz]e/i;

const INTEREST_KEYWORDS: [InterestId, RegExp][] = [
  ['food', /restaur|jedz|jedzen|kolacj|lunch|obiad|śniadan|sniadan|kawiar|głodn|glodn|kuchni/i],
  ['nature', /park|natur|zieleń|zielen|spacer|ogród|ogrod|plaż|plaz|widok/i],
  ['museums', /muze|galeri|wystaw/i],
  ['monuments', /zabytk|histor|kościół|koscio|zamek|pałac|palac|katedr/i],
  ['nightlife', /bar|klub|nocn|wieczor|imprez|drink/i],
];

const NEARBY_LIMIT_KM = 6;

const optimizeDay = (trip: Trip, day: TripDay): AskTripAssistantResult => {
  const dayName = day.customTitle || `Dzień ${day.dayNumber}`;
  if (day.items.length < 3) {
    return {
      message: `W planie „${dayName}” jest za mało punktów (${day.items.length}), żeby było co optymalizować. Dodaj kilka miejsc, a ułożę z nich najkrótszą trasę.`,
    };
  }

  const before = routeLengthKm(day.items);
  const sorted = sortByNearestNeighbor(day.items);
  const after = routeLengthKm(sorted);

  if (before - after < 0.05) {
    return { message: `Kolejność punktów w „${dayName}” jest już praktycznie optymalna (ok. ${before.toFixed(1)} km trasy).` };
  }

  // Zachowujemy dotychczasowe godziny – przypisujemy je rosnąco do nowej kolejności
  const times = day.items.map((i) => i.time).sort((x, y) => parseTime(x) - parseTime(y));
  const reorderedDayItems = sorted.map((item, i) => ({ ...item, time: times[i] }));
  const savedPct = Math.round(((before - after) / before) * 100);

  return {
    message: `Zoptymalizowałem trasę w „${dayName}” (${trip.title}): z ${before.toFixed(1)} km do ${after.toFixed(1)} km (−${savedPct}%). Pierwszy punkt zostaje bez zmian, kolejne układam od najbliższego sąsiada.`,
    reorderedDayItems,
  };
};

const suggestNearby = (trip: Trip, day: TripDay, prompt: string): AskTripAssistantResult => {
  const dayName = day.customTitle || `Dzień ${day.dayNumber}`;
  const center: LatLng = day.items.length > 0 ? centroid(day.items) : { lat: trip.lat, lng: trip.lng };
  const wantedCategories = INTEREST_KEYWORDS.filter(([, re]) => re.test(prompt)).map(([id]) => id);

  const curated = findCuratedCity(center);
  const cityName = shortCityName(trip.location);
  const existing = trip.days.flatMap((d) => d.items);
  const isKnown = (spot: LatLng & { title: string }) =>
    existing.some((e) => e.title === spot.title || distanceKm(e, spot) < 0.08);

  let candidates: Attraction[] = curated ? curated.attractions : [];
  if (wantedCategories.length > 0) candidates = candidates.filter((c) => wantedCategories.includes(c.category));
  candidates = candidates
    .filter((c) => !isKnown(c) && distanceKm(center, c) <= NEARBY_LIMIT_KM)
    .sort((x, y) => distanceKm(center, x) - distanceKm(center, y));

  if (candidates.length < 3) {
    const generic = generateGenericSpots(center, cityName, 6, wantedCategories, existing.length).filter((g) => !isKnown(g));
    candidates = [...candidates, ...generic];
  }

  const picks = candidates.slice(0, 3);
  const last = day.items.length > 0 ? Math.max(...day.items.map((i) => parseTime(i.time))) : 9 * 60;
  const suggestedItems = picks.map((spot, k) => {
    const base = spot.category === 'nightlife' ? 20.5 * 60 : last + 120 * (k + 1);
    return toScheduleItem(spot, formatTime(Math.min(base, 22 * 60)));
  });

  const list = picks.map((p) => `${p.title} (${distanceKm(center, p).toFixed(1)} km od środka planu)`).join('; ');
  return {
    message: `Propozycje w okolicy dla „${dayName}”: ${list}. Kliknij, aby dodać wybrane punkty do harmonogramu.`,
    suggestedItems,
  };
};

const ASSESS_RE = /temp|budżet|budzet|koszt|ocen|ile wydam|wydatk/i;

/** Ocena tempa (liczba punktów, dystans) i kosztów dnia względem dziennego budżetu podróży. */
const assessDay = (trip: Trip, day: TripDay): AskTripAssistantResult => {
  const dayName = day.customTitle || `Dzień ${day.dayNumber}`;
  if (day.items.length === 0) {
    return { message: `„${dayName}” jest pusty – nie mam czego oceniać. Dodaj kilka miejsc albo poproś o propozycje.` };
  }

  const km = routeLengthKm(day.items);
  const cost = day.items.reduce((s, i) => s + i.cost, 0);
  const n = day.items.length;
  const dailyBudget = trip.days.length > 0 ? trip.budget / trip.days.length : trip.budget;

  const pace = n <= 2 ? 'spokojne' : n <= 4 ? 'umiarkowane' : 'intensywne';
  const paceNote =
    n >= 6 ? ' To dużo punktów – rozważ przeniesienie części na inny dzień.' : n === 1 ? ' Zmieści się tu jeszcze coś.' : '';
  const walkNote = km > 8 ? ' Dystans jest długi – warto skorzystać z komunikacji miejskiej.' : '';

  const share = dailyBudget > 0 ? Math.round((cost / dailyBudget) * 100) : 0;
  const budgetNote =
    dailyBudget <= 0
      ? ''
      : share > 100
        ? ` Same atrakcje to ${share}% dziennego budżetu (${Math.round(dailyBudget)} ${trip.currency}) – to ponad limit.`
        : ` Atrakcje to ${share}% dziennego budżetu (${Math.round(dailyBudget)} ${trip.currency}), więc zostaje zapas na jedzenie i transport.`;

  return {
    message: `Tempo „${dayName}” jest ${pace}: ${n} ${n === 1 ? 'punkt' : n < 5 ? 'punkty' : 'punktów'}, trasa ok. ${km.toFixed(1)} km, koszt atrakcji ${cost} ${trip.currency}.${paceNote}${walkNote}${budgetNote}`,
  };
};

/** Odpowiada na polecenie użytkownika w kontekście aktywnego dnia: optymalizuje trasę lub proponuje nowe punkty. */
export async function askTripAssistant(params: AskTripAssistantParams): Promise<AskTripAssistantResult> {
  const { trip, activeDayId, prompt } = params;
  await simulateLatency();

  const day = trip.days.find((d) => d.id === activeDayId);
  if (!day) return { message: 'Wybierz dzień planu, a pomogę Ci go ulepszyć.' };

  if (OPTIMIZE_RE.test(prompt)) return optimizeDay(trip, day);
  if (ASSESS_RE.test(prompt)) return assessDay(trip, day);
  return suggestNearby(trip, day, prompt);
}
