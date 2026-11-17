import { MapContainer, TileLayer, Marker, Polyline, Popup, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Check, Plus, Loader2, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { DEFAULT_CENTER, DEFAULT_PIN_COLOR } from '../lib/constants';
import { Button } from './ui';
import type { ClickedPoint, Place } from '../types/place';

const explorerPinHtml = renderToStaticMarkup(
  <div className="w-3.5 h-3.5 bg-zinc-900 rounded-full shadow-sm border-[2px] border-white ring-2 ring-black/10 transform transition-transform hover:scale-125"></div>
);

const explorerPin = L.divIcon({
  html: explorerPinHtml,
  className: 'custom-leaflet-icon bg-transparent border-0',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

// Generator pinezki obsługujący zarówno klasy Tailwinda jak i kolory HEX / RGB
const createPlannerPin = (colorValue: string) => {
  const isCustomColor = colorValue && colorValue.startsWith('#');
  const style = isCustomColor ? { backgroundColor: colorValue } : {};
  const className = isCustomColor 
    ? "w-6 h-6 text-white rounded-full shadow-sm border-2 border-white flex items-center justify-center transform transition-transform hover:scale-125"
    : `w-6 h-6 ${colorValue || 'bg-emerald-600'} text-white rounded-full shadow-sm border-2 border-white flex items-center justify-center transform transition-transform hover:scale-125`;

  const html = renderToStaticMarkup(
    <div className={className} style={style}>
      <div className="w-2 h-2 bg-white rounded-full"></div>
    </div>
  );
  return L.divIcon({
    html,
    className: 'custom-planner-leaflet-icon bg-transparent border-0',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

/** Linia trasy łącząca punkty dnia w kolejności odwiedzania. */
export interface MapRoute {
  /** Punkty [lat, lng] w kolejności przejścia. */
  points: [number, number][];
  /** Kolor HEX linii (np. kolor aktywnego dnia). */
  color: string;
}

interface TravelMapProps {
  route?: MapRoute | null;
  places: Place[];
  visitedPlaces: Place[];
  onTogglePlace: (place: Place) => void;
  className?: string;
  zoomControl?: boolean;
  center?: [number, number];
  zoom?: number;
  isPlannerMode?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  clickedPoint?: ClickedPoint | null;
  onAddClickedPoint?: () => void;
  onCloseClickedPoint?: () => void;
}

// Komponent do płynnego przesuwania mapy
function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  const [lat, lng] = center;
  
  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 });
    }
  }, [lat, lng, zoom, map]);
  
  return null;
}

function MapEventsHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export function TravelMap({
  route,
  places,
  visitedPlaces, 
  onTogglePlace, 
  className = "w-full h-full", 
  zoomControl = true, 
  center = DEFAULT_CENTER, 
  zoom = 4,
  isPlannerMode = false,
  onMapClick,
  clickedPoint,
  onAddClickedPoint,
  onCloseClickedPoint
}: TravelMapProps) {
  const [openPopupPlace, setOpenPopupPlace] = useState<Place | null>(null);

  const displayedPlacesMap = new Map<string, Place>();
  visitedPlaces.forEach(p => displayedPlacesMap.set(p.id, p));
  places.forEach(p => displayedPlacesMap.set(p.id, p));
  if (openPopupPlace) {
    displayedPlacesMap.set(openPopupPlace.id, openPopupPlace);
  }
  const displayedPlaces = Array.from(displayedPlacesMap.values());

  return (
    <MapContainer center={center} zoom={zoom} className={`z-0 ${className}`} zoomControl={false}>
      <MapUpdater center={center} zoom={zoom} />
      <MapEventsHandler onMapClick={onMapClick} />
      {zoomControl && <ZoomControl position="bottomright" />}
      
      <TileLayer
        url="https://mt1.google.com/vt/lyrs=m&hl=pl&x={x}&y={y}&z={z}"
        attribution='&copy; Google Maps'
      />
      
      {route && route.points.length > 1 && (
        <Polyline
          positions={route.points}
          pathOptions={{
            color: route.color.startsWith('#') ? route.color : DEFAULT_PIN_COLOR,
            weight: 4,
            opacity: 0.75,
            dashArray: '8 8',
            lineCap: 'round',
            lineJoin: 'round',
          }}
          interactive={false}
        />
      )}

      {displayedPlaces.map(place => {
        const isVisited = visitedPlaces.some(p => p.id === place.id);
        const currentPin = isPlannerMode 
          ? createPlannerPin(place.color || 'bg-emerald-600') 
          : explorerPin;

        return (
          <Marker 
            key={place.id} 
            position={[place.lat, place.lng]} 
            icon={currentPin}
            eventHandlers={{
              popupopen: () => setOpenPopupPlace(place),
              popupclose: () => setOpenPopupPlace(null)
            }}
          >
            <Popup autoPan autoPanPadding={[24, 72]} closeButton={false} className="app-popup">
              <div className="bg-white rounded-lg p-3.5 shadow-sm border border-stone-200/80 min-w-[240px] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="bg-stone-100 p-2 rounded-lg shrink-0">
                    <MapPin className="w-4 h-4 text-stone-600" />
                  </div>
                  <span className="font-bold text-zinc-900 text-xs truncate leading-snug">
                    {place.displayName || place.name}
                  </span>
                </div>
                {!isPlannerMode && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onTogglePlace(place); }}
                    className="px-3 py-1.5 text-xs shrink-0"
                  >
                    {isVisited ? (
                      <><Check className="w-3.5 h-3.5 text-stone-600" /> <span>Dodano</span></>
                    ) : (
                      <><Plus className="w-3.5 h-3.5 text-stone-600" /> <span>Dodaj</span></>
                    )}
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {clickedPoint && (
        <Popup 
          position={[clickedPoint.lat, clickedPoint.lng]} 
          eventHandlers={{
            remove: () => onCloseClickedPoint?.()
          }}
          autoPan
          autoPanPadding={[24, 72]}
          className="app-popup"
        >
          <div className="bg-white rounded-lg p-4 shadow-sm border border-stone-200/80 min-w-[220px] flex flex-col gap-3">
            {clickedPoint.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-4 h-4 text-stone-600 animate-spin" />
                <span className="font-bold text-stone-700 text-xs">Pobieranie lokacji...</span>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2.5">
                  <div className="bg-stone-100 p-2 rounded-lg shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">Wybrane miejsce</div>
                    <div className="font-bold text-zinc-900 text-sm leading-tight mt-0.5">
                      {clickedPoint.name}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  fullWidth
                  onClick={(e) => { e.stopPropagation(); onAddClickedPoint?.(); }}
                  className="text-xs"
                >
                  <Plus className="w-4 h-4" /> Dodaj do planu dnia
                </Button>
              </>
            )}
          </div>
        </Popup>
      )}
    </MapContainer>
  );
}