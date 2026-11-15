import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Check, Plus, Loader2, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';

// 1. Styl pinezki dla MAPY ODKRYWCY (Dashboard)
const explorerPinHtml = renderToStaticMarkup(
  <div className="bg-slate-900 text-white p-1.5 rounded-full shadow-lg border-2 border-white flex items-center justify-center transform transition-transform hover:scale-110">
    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
  </div>
);

const explorerPin = L.divIcon({
  html: explorerPinHtml,
  className: 'custom-leaflet-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

// 2. Styl pinezki dla PLANERA (Nowoczesny, zielony pin z ikoną)
const plannerPinHtml = renderToStaticMarkup(
  <div className="bg-emerald-500 text-white p-2 rounded-full shadow-xl border-2 border-white flex items-center justify-center transform transition-transform hover:scale-110">
    <MapPin className="w-3.5 h-3.5 fill-current" />
  </div>
);

const plannerPin = L.divIcon({
  html: plannerPinHtml,
  className: 'custom-planner-leaflet-icon',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

const DEFAULT_CENTER: [number, number] = [50.0614, 19.9365];

interface Place {
  id: string;
  name: string;
  displayName?: string;
  lat: number;
  lng: number;
}

interface TravelMapProps {
  places: Place[];
  visitedPlaces: Place[];
  onTogglePlace: (place: Place) => void;
  className?: string;
  zoomControl?: boolean;
  center?: [number, number];
  zoom?: number;
  isPlannerMode?: boolean; // Flaga określająca czy to mapa w Planerze
  
  onMapClick?: (lat: number, lng: number) => void;
  clickedPoint?: { lat: number, lng: number, name: string, isLoading: boolean } | null;
  onAddClickedPoint?: () => void;
  onCloseClickedPoint?: () => void;
}

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  const [lat, lng] = center;
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { animate: true, duration: 1.5 });
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

  const displayedPlacesMap = new Map();
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
      
      {displayedPlaces.map(place => {
        const isVisited = visitedPlaces.some(p => p.id === place.id);
        const currentPin = isPlannerMode ? plannerPin : explorerPin;

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
            <Popup autoPan={false} closeButton={false} className="custom-dark-popup">
              <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-slate-700/60 min-w-[240px] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="bg-emerald-500/20 p-2 rounded-xl shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="font-bold text-white text-xs truncate leading-snug">
                    {place.name}
                  </span>
                </div>
                {!isPlannerMode && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onTogglePlace(place); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shrink-0"
                  >
                    {isVisited ? (
                      <><Check className="w-3.5 h-3.5 text-emerald-400" /> <span>Dodano</span></>
                    ) : (
                      <><Plus className="w-3.5 h-3.5 text-emerald-400" /> <span>Dodaj</span></>
                    )}
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* KLIKNIĘTE MIEJSCE W PLANERZE */}
      {clickedPoint && (
        <Popup 
          position={[clickedPoint.lat, clickedPoint.lng]} 
          eventHandlers={{
            remove: () => onCloseClickedPoint?.()
          }}
          className="custom-dark-popup"
        >
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-700/60 min-w-[220px] flex flex-col gap-3">
            {clickedPoint.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                <span className="font-bold text-white text-xs">Pobieranie lokacji...</span>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2.5">
                  <div className="bg-emerald-500/20 p-2 rounded-xl shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Wybrane miejsce</div>
                    <div className="font-bold text-white text-sm leading-tight mt-0.5">
                      {clickedPoint.name}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onAddClickedPoint?.(); }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Dodaj do planu dnia
                </button>
              </>
            )}
          </div>
        </Popup>
      )}

    </MapContainer>
  );
}