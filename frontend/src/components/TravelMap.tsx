import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Check, Plus, Loader2 } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';

const customIconHtml = renderToStaticMarkup(
  <div className="bg-slate-900 text-white p-1.5 rounded-full shadow-lg border-2 border-white flex items-center justify-center transform transition-transform hover:scale-110">
    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
  </div>
);

const customPin = L.divIcon({
  html: customIconHtml,
  className: 'custom-leaflet-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

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
  
  // Nowe propsy do obsługi klikania w mapę
  onMapClick?: (lat: number, lng: number) => void;
  clickedPoint?: { lat: number, lng: number, name: string, isLoading: boolean } | null;
  onAddClickedPoint?: () => void;
  onCloseClickedPoint?: () => void;
}

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

// Komponent przechwytujący kliknięcia na samej mapie
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
  center = [50.0614, 19.9365], 
  zoom = 4,
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
        return (
          <Marker 
            key={place.id} 
            position={[place.lat, place.lng]} 
            icon={customPin}
            eventHandlers={{
              popupopen: () => setOpenPopupPlace(place),
              popupclose: () => setOpenPopupPlace(null)
            }}
          >
            <Popup autoPan={false} closeButton={false} className="custom-dark-popup">
              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-slate-700/50 min-w-[220px] transform transition-all flex items-center justify-between gap-4">
                <span className="font-bold text-white text-sm m-0 leading-tight">
                  {place.displayName || place.name}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onTogglePlace(place); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                >
                  {isVisited ? (
                    <><Check className="w-3.5 h-3.5 text-slate-300" /> <span>Dodano</span></>
                  ) : (
                    <><Plus className="w-3.5 h-3.5 text-slate-300" /> <span>Dodaj</span></>
                  )}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* TYMCZASOWY POPUP DLA KLIKNIĘTEGO MIEJSCA */}
      {clickedPoint && (
        <Popup 
          position={[clickedPoint.lat, clickedPoint.lng]} 
          eventHandlers={{
            remove: () => onCloseClickedPoint?.() // event 'remove' w Leaflecie odpala się przy zamknięciu popupa
          }}
          className="custom-dark-popup"
        >
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-700/50 min-w-[200px] flex flex-col gap-3">
            
            {clickedPoint.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                <span className="font-bold text-white text-xs">Pobieranie danych...</span>
              </div>
            ) : (
              <>
                <span className="font-bold text-white text-sm leading-tight text-center">
                  {clickedPoint.name}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onAddClickedPoint?.(); }}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Dodaj do planu
                </button>
              </>
            )}
            
          </div>
        </Popup>
      )}

    </MapContainer>
  );
}