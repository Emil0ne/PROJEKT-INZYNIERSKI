export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Odległość po powierzchni Ziemi (wzór haversine) w kilometrach. */
export const distanceKm = (a: LatLng, b: LatLng): number => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

/** Długość trasy przechodzącej kolejno przez wszystkie punkty (km). */
export const routeLengthKm = (points: LatLng[]): number =>
  points.reduce((sum, p, i) => (i === 0 ? 0 : sum + distanceKm(points[i - 1], p)), 0);

/** Format dystansu po polsku: „4,2 km” lub „350 m” dla krótkich odcinków. */
export const formatKm = (km: number): string =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;

/**
 * Heurystyka najbliższego sąsiada: zaczyna od pierwszego punktu i za każdym razem
 * przechodzi do najbliższego nieodwiedzonego. Zwraca nową tablicę (nie mutuje wejścia).
 */
export const sortByNearestNeighbor = <T extends LatLng>(points: T[]): T[] => {
  if (points.length < 3) return [...points];
  const remaining = points.slice(1);
  const result: T[] = [points[0]];
  while (remaining.length > 0) {
    const last = result[result.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((p, i) => {
      const d = distanceKm(last, p);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    result.push(remaining.splice(bestIdx, 1)[0]);
  }
  return result;
};

/** Środek ciężkości (średnia arytmetyczna współrzędnych – wystarczająca w skali miasta). */
export const centroid = (points: LatLng[]): LatLng => {
  if (points.length === 0) return { lat: 0, lng: 0 };
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
};
