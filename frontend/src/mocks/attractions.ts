import { distanceKm, type LatLng } from '../lib/geo';

/** Kategorie zainteresowań – identyfikatory używane w UI, URL i kontrakcie API. */
export type InterestId = 'monuments' | 'food' | 'nature' | 'museums' | 'nightlife';

export const INTEREST_LABELS: Record<InterestId, string> = {
  monuments: 'Zabytki',
  food: 'Gastronomia',
  nature: 'Natura',
  museums: 'Muzea',
  nightlife: 'Nocne życie',
};

export const INTEREST_IDS = Object.keys(INTEREST_LABELS) as InterestId[];

export const isInterestId = (value: string): value is InterestId => value in INTEREST_LABELS;

export interface Attraction extends LatLng {
  title: string;
  category: InterestId;
  /** Orientacyjny koszt wejścia / posiłku na osobę w PLN. */
  cost: number;
}

export interface CuratedCity extends LatLng {
  name: string;
  attractions: Attraction[];
}

const a = (title: string, category: InterestId, lat: number, lng: number, cost: number): Attraction => ({
  title,
  category,
  lat,
  lng,
  cost,
});

/** Ręcznie wybrane atrakcje – mock do czasu podpięcia backendu z OpenAI. */
export const CURATED_CITIES: CuratedCity[] = [
  {
    name: 'Londyn',
    lat: 51.5074,
    lng: -0.1278,
    attractions: [
      a('Tower of London', 'monuments', 51.5081, -0.0759, 120),
      a('Opactwo Westminsterskie', 'monuments', 51.4993, -0.1273, 100),
      a('Big Ben i Pałac Westminsterski', 'monuments', 51.5007, -0.1246, 0),
      a('Katedra św. Pawła', 'monuments', 51.5138, -0.0984, 90),
      a('Pałac Buckingham', 'monuments', 51.5014, -0.1419, 0),
      a('British Museum', 'museums', 51.5194, -0.127, 0),
      a('National Gallery', 'museums', 51.5089, -0.1283, 0),
      a('Tate Modern', 'museums', 51.5076, -0.0994, 0),
      a('Hyde Park', 'nature', 51.5073, -0.1657, 0),
      a("Regent's Park", 'nature', 51.5313, -0.157, 0),
      a('Ogrody Kew', 'nature', 51.4787, -0.2956, 85),
      a('Borough Market', 'food', 51.5055, -0.091, 60),
      a('Camden Market', 'food', 51.5415, -0.1465, 50),
      a('Covent Garden – lunch', 'food', 51.513, -0.126, 80),
      a('Soho – puby i bary', 'nightlife', 51.5134, -0.131, 90),
      a('Shoreditch – bary i kluby', 'nightlife', 51.5246, -0.0788, 90),
    ],
  },
  {
    name: 'Rzym',
    lat: 41.9028,
    lng: 12.4964,
    attractions: [
      a('Koloseum', 'monuments', 41.8902, 12.4922, 80),
      a('Forum Romanum', 'monuments', 41.8925, 12.4853, 0),
      a('Panteon', 'monuments', 41.8986, 12.4769, 20),
      a('Fontanna di Trevi', 'monuments', 41.9009, 12.4833, 0),
      a('Piazza Navona', 'monuments', 41.8992, 12.4731, 0),
      a('Bazylika św. Piotra', 'monuments', 41.9022, 12.4539, 0),
      a('Muzea Watykańskie', 'museums', 41.9065, 12.4536, 120),
      a('Galleria Borghese', 'museums', 41.9142, 12.4921, 100),
      a('Villa Borghese', 'nature', 41.9128, 12.4923, 0),
      a('Wzgórze Janikulum', 'nature', 41.8918, 12.4617, 0),
      a('Trastevere – kolacja', 'food', 41.8892, 12.4699, 120),
      a("Campo de' Fiori – targ", 'food', 41.8956, 12.4722, 50),
      a('Targ Testaccio', 'food', 41.8764, 12.4752, 50),
      a('Trastevere – bary', 'nightlife', 41.8897, 12.4693, 80),
      a('Pigneto – kluby', 'nightlife', 41.8887, 12.5322, 80),
    ],
  },
  {
    name: 'Palermo (Sycylia)',
    lat: 38.1157,
    lng: 13.3615,
    attractions: [
      a('Katedra w Palermo', 'monuments', 38.1142, 13.3567, 30),
      a('Pałac Normanów i Kaplica Palatyńska', 'monuments', 38.1105, 13.3535, 50),
      a('Quattro Canti', 'monuments', 38.1157, 13.3613, 0),
      a('Katedra w Monreale', 'monuments', 38.0805, 13.2913, 40),
      a('Teatro Massimo', 'museums', 38.1204, 13.3566, 40),
      a('Muzeum Archeologiczne', 'museums', 38.119, 13.359, 30),
      a('Galeria Sztuki Nowoczesnej', 'museums', 38.117, 13.364, 25),
      a('Plaża Mondello', 'nature', 38.2, 13.32, 0),
      a('Monte Pellegrino', 'nature', 38.165, 13.355, 0),
      a('Targ Ballarò', 'food', 38.11, 13.3615, 40),
      a('Targ Il Capo', 'food', 38.12, 13.356, 40),
      a('Vucciria – wieczór', 'nightlife', 38.118, 13.368, 70),
    ],
  },
  {
    name: 'Kraków',
    lat: 50.0614,
    lng: 19.9365,
    attractions: [
      a('Wawel', 'monuments', 50.054, 19.9352, 40),
      a('Rynek Główny', 'monuments', 50.0617, 19.9373, 0),
      a('Kościół Mariacki', 'monuments', 50.0617, 19.939, 15),
      a('Kazimierz – spacer', 'monuments', 50.051, 19.944, 0),
      a('Fabryka Schindlera', 'museums', 50.0475, 19.9628, 35),
      a('MOCAK', 'museums', 50.0478, 19.9609, 25),
      a('Muzeum Czartoryskich', 'museums', 50.0645, 19.939, 30),
      a('Planty', 'nature', 50.062, 19.934, 0),
      a('Kopiec Kościuszki', 'nature', 50.0545, 19.8929, 20),
      a('Bulwary Wiślane', 'nature', 50.049, 19.93, 0),
      a('Plac Nowy – zapiekanki', 'food', 50.0516, 19.9444, 25),
      a('Stary Kleparz', 'food', 50.069, 19.94, 30),
      a('Kazimierz – bary', 'nightlife', 50.051, 19.946, 60),
    ],
  },
  {
    name: 'Paryż',
    lat: 48.8566,
    lng: 2.3522,
    attractions: [
      a('Wieża Eiffla', 'monuments', 48.8584, 2.2945, 120),
      a('Łuk Triumfalny', 'monuments', 48.8738, 2.295, 60),
      a('Notre-Dame', 'monuments', 48.853, 2.3499, 0),
      a('Sacré-Cœur', 'monuments', 48.8867, 2.3431, 0),
      a('Luwr', 'museums', 48.8606, 2.3376, 90),
      a("Musée d'Orsay", 'museums', 48.86, 2.3266, 80),
      a('Centre Pompidou', 'museums', 48.8606, 2.3522, 70),
      a('Ogród Luksemburski', 'nature', 48.8462, 2.3372, 0),
      a('Park Buttes-Chaumont', 'nature', 48.8809, 2.3828, 0),
      a('Marché des Enfants Rouges', 'food', 48.8629, 2.3629, 60),
      a('Le Marais – lunch', 'food', 48.8575, 2.3622, 70),
      a('Canal Saint-Martin – bary', 'nightlife', 48.871, 2.365, 80),
      a('Moulin Rouge', 'nightlife', 48.8841, 2.3322, 400),
    ],
  },
  {
    name: 'Barcelona',
    lat: 41.3874,
    lng: 2.1686,
    attractions: [
      a('Sagrada Família', 'monuments', 41.4036, 2.1744, 120),
      a('Casa Batlló', 'monuments', 41.3917, 2.1649, 130),
      a('Dzielnica Gotycka', 'monuments', 41.3825, 2.1769, 0),
      a('Muzeum Picassa', 'museums', 41.3852, 2.1809, 55),
      a('MNAC', 'museums', 41.3685, 2.1534, 50),
      a('Park Güell', 'nature', 41.4145, 2.1527, 45),
      a('Parc de la Ciutadella', 'nature', 41.388, 2.187, 0),
      a('Bunkers del Carmel', 'nature', 41.419, 2.162, 0),
      a('La Boqueria', 'food', 41.3817, 2.1719, 50),
      a('El Born – tapas', 'food', 41.385, 2.183, 80),
      a('Port Olímpic – kluby', 'nightlife', 41.386, 2.2, 90),
      a('Razzmatazz', 'nightlife', 41.398, 2.191, 80),
    ],
  },
  {
    name: 'Warszawa',
    lat: 52.2297,
    lng: 21.0122,
    attractions: [
      a('Zamek Królewski', 'monuments', 52.248, 21.015, 40),
      a('Rynek Starego Miasta', 'monuments', 52.2497, 21.0122, 0),
      a('Pałac Kultury i Nauki', 'monuments', 52.2318, 21.006, 30),
      a('Pałac w Wilanowie', 'monuments', 52.165, 21.09, 40),
      a('Muzeum Powstania Warszawskiego', 'museums', 52.2323, 20.9806, 30),
      a('Muzeum POLIN', 'museums', 52.2493, 20.9939, 35),
      a('Muzeum Narodowe', 'museums', 52.2321, 21.0245, 25),
      a('Łazienki Królewskie', 'nature', 52.215, 21.035, 0),
      a('Park Skaryszewski', 'nature', 52.24, 21.055, 0),
      a('Hala Koszyki', 'food', 52.221, 21.019, 60),
      a('Bazar Różyckiego', 'food', 52.253, 21.04, 30),
      a('Plac Zbawiciela – bary', 'nightlife', 52.219, 21.019, 70),
    ],
  },
];

/** Najbliższe miasto z listy, jeśli leży w promieniu `maxKm`; w przeciwnym razie null. */
export const findCuratedCity = (point: LatLng, maxKm = 60): CuratedCity | null => {
  let best: CuratedCity | null = null;
  let bestDist = Infinity;
  for (const city of CURATED_CITIES) {
    const d = distanceKm(point, city);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return best && bestDist <= maxKm ? best : null;
};
