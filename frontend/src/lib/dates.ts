import type { TripDay } from '../types/trip';
import { DAY_COLORS } from './constants';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Liczba dni podróży włącznie z pierwszym i ostatnim (min. 1). Daty w formacie 'YYYY-MM-DD'. */
export const countTripDays = (startDate: string, endDate: string): number => {
  const diff = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / MS_PER_DAY) + 1;
  return Number.isFinite(diff) ? Math.max(1, diff) : 1;
};

/** Tworzy puste dni harmonogramu dla zakresu dat (puste, gdy brak którejś z dat). */
export const generateTripDays = (startDate: string | null, endDate: string | null): TripDay[] => {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate);
  return Array.from({ length: countTripDays(startDate, endDate) }).map((_, i) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + i);
    return {
      id: `d${i + 1}`,
      date: date.toISOString().split('T')[0],
      dayNumber: i + 1,
      customTitle: '',
      color: DAY_COLORS[i % DAY_COLORS.length],
      items: [],
    };
  });
};

/** Etykieta „za ile dni” dla listy podróży w Dashboardzie. */
export const getDaysUntil = (startDate: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const diffDays = Math.round((start.getTime() - today.getTime()) / MS_PER_DAY);

  if (diffDays === 0) return 'Dzisiaj';
  if (diffDays === 1) return 'Jutro';
  if (diffDays < 0) return 'Zakończona';
  return `Za ${diffDays} dni`;
};
