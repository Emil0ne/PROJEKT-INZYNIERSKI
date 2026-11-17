/** Rodzaj miejsca zwracany przez geokodowanie. */
export type PlaceKind = 'city' | 'region' | 'country' | 'other';

/** Miejsce wyświetlane na mapie (pinezka). */
export interface Place {
  id: string;
  name: string;
  displayName?: string;
  lat: number;
  lng: number;
  /** Kolor pinezki w formacie HEX (np. '#10b981'). */
  color?: string;
}

/** Jednolity wynik geokodowania (niezależnie od dostawcy: Open-Meteo / Nominatim). */
export interface GeocodedPlace {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  kind: PlaceKind;
}

/** Punkt kliknięty na mapie w trybie planera (po reverse geocodingu). */
export interface ClickedPoint {
  lat: number;
  lng: number;
  name: string;
  isLoading: boolean;
}
