/** Domyślny środek mapy (Kraków) – używany, gdy nie znamy celu podróży. */
export const DEFAULT_CENTER: [number, number] = [50.0614, 19.9365];

/** Domyślna waluta (kod ISO 4217). */
export const DEFAULT_CURRENCY = 'PLN';

/** Domyślny całkowity budżet nowo planowanej podróży (w DEFAULT_CURRENCY). */
export const DEFAULT_TOTAL_BUDGET = 3000;

/** Kolory pinezek przypisywane kolejnym dniom (po wyczerpaniu lista się zapętla). */
export const DAY_COLORS = ['#10b981', '#2563eb', '#f59e0b', '#9333ea', '#f43f5e', '#ea580c'];

/** Fallback koloru pinezki, gdy dzień nie ma ustawionego koloru. */
export const DEFAULT_PIN_COLOR = DAY_COLORS[0];
