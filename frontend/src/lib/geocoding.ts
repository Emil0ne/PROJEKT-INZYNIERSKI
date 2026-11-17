import type { GeocodedPlace, PlaceKind } from '../types/place';

/**
 * Wspólny serwis geokodowania:
 *  - Open-Meteo  → miasta, regiony, państwa (searchCities),
 *  - Nominatim   → adresy, lotniska, miejsca, reverse geocoding.
 * Funkcje rzucają wyjątek przy błędzie sieci – obsługa leży po stronie wywołującego.
 */

// ---------- helpery współdzielone ----------

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
  return res.json() as Promise<T>;
};

const uniqueStrings = (v: string, i: number, arr: string[]) => arr.indexOf(v) === i;

const dedupeByDisplayName = (places: GeocodedPlace[]) =>
  places.filter((item, i, arr) => i === arr.findIndex((t) => t.displayName === item.displayName));

/** Zoom mapy dla rodzaju miejsca (kraj → daleko, miasto → blisko). */
export const zoomForKind = (kind: PlaceKind | string | null): number =>
  kind === 'country' ? 5 : kind === 'region' ? 8 : 11;

/** Połowa boku obszaru (w stopniach) preferowanego przy wyszukiwaniu, zależnie od zoomu. */
export const biasDeltaForZoom = (zoom: number): number => (zoom >= 10 ? 0.4 : zoom >= 7 ? 2 : 10);

// ---------- Open-Meteo (miasta) ----------

interface OpenMeteoResult {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  feature_code?: string;
}

const fromOpenMeteo = (r: OpenMeteoResult, includeAdmin1: boolean): GeocodedPlace => {
  const code = r.feature_code || '';
  const kind: PlaceKind = code.startsWith('PCL') ? 'country' : code === 'ADM1' ? 'region' : 'city';
  const parts = includeAdmin1 && kind !== 'country' ? [r.name, r.admin1, r.country] : [r.name, r.country];
  const displayName =
    includeAdmin1 && kind === 'country'
      ? r.name
      : parts.filter((v): v is string => Boolean(v)).filter(uniqueStrings).join(', ');
  return { id: String(r.id), name: r.name, displayName, lat: r.latitude, lng: r.longitude, kind };
};

export interface SearchCitiesOptions {
  /** Maks. liczba zwracanych wyników. */
  limit?: number;
  /**
   * true  → tryb „cel podróży”: tylko miejscowości/państwa/regiony, nazwa z regionem (admin1),
   *         kraje na górze listy.
   * false → tryb „odwiedzone miejsca”: nazwa + kraj, bez filtrowania.
   */
  destinationMode?: boolean;
}

/** Wyszukuje miasta/regiony/państwa (Open-Meteo, od 3 znaków, wyniki po polsku). */
export async function searchCities(query: string, options: SearchCitiesOptions = {}): Promise<GeocodedPlace[]> {
  const { limit = 6, destinationMode = false } = options;
  const count = destinationMode ? 15 : limit;
  const data = await fetchJson<{ results?: OpenMeteoResult[] }>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=${count}&language=pl&format=json`,
  );
  let results = data?.results ?? [];

  if (destinationMode) {
    results = results.filter((r) => {
      const code = r.feature_code || '';
      return !code || code.startsWith('PPL') || code.startsWith('PCL') || code === 'ADM1';
    });
  }

  const unique = dedupeByDisplayName(results.map((r) => fromOpenMeteo(r, destinationMode)));
  if (destinationMode) {
    unique.sort((a, b) => (a.kind === 'country' ? 0 : 1) - (b.kind === 'country' ? 0 : 1));
  }
  return unique.slice(0, limit);
}

// ---------- Nominatim (adresy, lotniska, reverse) ----------

interface NominatimSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  addresstype?: string;
}

interface NominatimReverseResult {
  name?: string;
  display_name?: string;
  address?: { road?: string };
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

const fromNominatim = (r: NominatimSearchResult): GeocodedPlace => ({
  id: String(r.place_id),
  name: r.display_name ? r.display_name.split(',')[0] : 'Miejsce',
  displayName: r.display_name || '',
  lat: parseFloat(r.lat),
  lng: parseFloat(r.lon),
  kind: r.addresstype === 'country' ? 'country' : 'other',
});

export interface SearchBias {
  lat: number;
  lng: number;
  /** Połowa boku obszaru preferowanego, w stopniach. */
  delta: number;
}

/** Wyszukuje miejsca/adresy (Nominatim), opcjonalnie z preferencją okolicy (viewbox). */
export async function searchPlaces(
  query: string,
  options: { limit?: number; bias?: SearchBias | null } = {},
): Promise<GeocodedPlace[]> {
  const { limit = 6, bias } = options;
  let url = `${NOMINATIM}/search?format=json&limit=${limit}&accept-language=pl&q=${encodeURIComponent(query.trim())}`;
  if (bias) {
    const left = bias.lng - bias.delta;
    const right = bias.lng + bias.delta;
    const top = bias.lat + bias.delta;
    const bottom = bias.lat - bias.delta;
    url += `&viewbox=${left},${top},${right},${bottom}`;
  }
  const data = await fetchJson<NominatimSearchResult[] | null>(url);
  return (data || []).map(fromNominatim);
}

/** Wyszukuje lotniska (Nominatim). */
export async function searchAirports(query: string, limit = 5): Promise<GeocodedPlace[]> {
  const data = await fetchJson<NominatimSearchResult[] | null>(
    `${NOMINATIM}/search?format=json&q=${encodeURIComponent(query + ' lotnisko airport')}&limit=${limit}&accept-language=pl`,
  );
  return (data || []).map(fromNominatim);
}

/** Zwraca pierwsze trafienie dla podanego adresu/nazwy albo null. */
export async function geocodeAddress(query: string): Promise<GeocodedPlace | null> {
  const results = await searchPlaces(query, { limit: 1 });
  return results[0] ?? null;
}

/** Reverse geocoding: współrzędne → czytelna nazwa miejsca. */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const data = await fetchJson<NominatimReverseResult | null>(
    `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=pl`,
  );
  if (data && data.display_name) {
    return data.name || data.address?.road || data.display_name.split(',')[0];
  }
  return 'Wybrane miejsce';
}
