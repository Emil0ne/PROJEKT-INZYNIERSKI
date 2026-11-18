export type TripStatus = 'upcoming' | 'ongoing' | 'past';

export type ScheduleItemType = 'activity' | 'transport';

/** Pojedyncza atrakcja / punkt w harmonogramie dnia. */
export interface ScheduleItem {
  id: string;
  title: string;
  /** Godzina w formacie 'HH:mm'. */
  time: string;
  type: ScheduleItemType;
  lat: number;
  lng: number;
  cost: number;
}

export interface TripDay {
  id: string;
  /** Data w formacie ISO 'YYYY-MM-DD'. */
  date: string;
  dayNumber: number;
  customTitle: string;
  /** Kolor pinezek tego dnia w formacie HEX. */
  color: string;
  items: ScheduleItem[];
}

/** Dane podróży używane na liście w Dashboardzie. */
export interface TripSummary {
  id: string;
  title: string;
  location: string;
  /** Data w formacie ISO 'YYYY-MM-DD'. */
  startDate: string;
  /** Data w formacie ISO 'YYYY-MM-DD'. */
  endDate: string;
  status: TripStatus;
  imageUrl: string;
  lat: number;
  lng: number;
  zoom: number;
  budget: number;
  /** Kod waluty ISO 4217, np. 'PLN'. */
  currency: string;
}

/** Pełna podróż wraz z harmonogramem (widok Planera). */
export interface Trip extends TripSummary {
  days: TripDay[];
}

export interface PackingItem {
  id: string;
  text: string;
  packed: boolean;
}
