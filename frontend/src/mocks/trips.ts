import type { BudgetItem } from '../types/budget';
import type { Place } from '../types/place';
import type { PackingItem, Trip } from '../types/trip';

/** Wspólne źródło danych dla Dashboardu i Planera (docelowo zastąpi je REST API). */
export const SICILY_TRIP: Trip = {
  id: '1',
  title: 'Włoskie Wakacje',
  location: 'Sycylia, Włochy',
  startDate: '2026-05-25',
  endDate: '2026-05-29',
  status: 'upcoming',
  imageUrl:
    'https://commons.wikimedia.org/wiki/Special:FilePath/Taormina_Teatro_Greco.jpg?width=800',
  lat: 37.5999,
  lng: 14.0154,
  zoom: 8,
  budget: 4500,
  currency: 'PLN',
  days: [
    {
      id: 'd1',
      date: '2026-05-25',
      dayNumber: 1,
      customTitle: '',
      color: '#10b981',
      items: [
        { id: 'i1', title: 'Przylot i odbiór Fiata Pandy', time: '10:00', type: 'transport', lat: 37.4698, lng: 15.0659, cost: 800 },
      ],
    },
    {
      id: 'd2',
      date: '2026-05-26',
      dayNumber: 2,
      customTitle: '',
      color: '#2563eb',
      items: [
        { id: 'i4', title: 'Zwiedzanie Taorminy (Teatr Antyczny)', time: '09:30', type: 'activity', lat: 37.8523, lng: 15.2922, cost: 120 },
      ],
    },
  ],
};

export const LONDON_TRIP: Trip = {
  id: '2',
  title: 'Mecz Chelsea',
  location: 'Londyn, UK',
  startDate: '2027-04-10',
  endDate: '2027-04-12',
  status: 'upcoming',
  imageUrl:
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  lat: 51.5074,
  lng: -0.1278,
  zoom: 11,
  budget: 3000,
  currency: 'PLN',
  days: [],
};

export const MOCK_TRIPS: Trip[] = [SICILY_TRIP, LONDON_TRIP];

export const getTripById = (id: string | undefined): Trip | undefined =>
  MOCK_TRIPS.find((t) => t.id === id);

export const VISITED_PLACES: Place[] = [
  { id: 'v1', name: 'Londyn', displayName: 'Londyn, UK', lat: 51.5074, lng: -0.1278 },
  { id: 'v2', name: 'Wrocław', displayName: 'Wrocław, Polska', lat: 51.1079, lng: 17.0385 },
];

export const DEFAULT_BUDGET_ITEMS: BudgetItem[] = [
  { id: 'flight-default', title: 'Loty w obie strony', category: 'Loty', cost: 1200, currency: 'PLN' },
  { id: 'hotel-default', title: 'Hotel / Nocleg', category: 'Hotel', cost: 1500, currency: 'PLN' },
];

export const DEFAULT_PACKING_ITEMS: PackingItem[] = [
  { id: 'p1', text: 'Paszport / Dowód osobisty', packed: false },
  { id: 'p2', text: 'Ładowarka do telefonu', packed: true },
];
