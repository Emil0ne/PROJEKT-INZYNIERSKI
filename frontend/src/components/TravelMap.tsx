// src/components/TravelMap.tsx
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Check, Plus } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';

// Ciemna pinezka
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
  popupAnchor: [0, -18],
});

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface TravelMapProps {
  places: Place[];
  visitedPlaces: Place[];
  onTogglePlace: (place: Place) => void;
  className?: string;
  zoomControl?: boolean;
}

export function TravelMap({ places, visitedPlaces, onTogglePlace, className = "w-full h-full", zoomControl = true }: TravelMapProps) {
  const [openPopupPlace, setOpenPopupPlace] = useState<Place | null>(null);

  // Łączymy unikalne miejsca do wyświetlenia (żeby dymek nie znikał przy odznaczaniu)
  const displayedPlacesMap = new Map();
  visitedPlaces.forEach(p => displayedPlacesMap.set(p.id, p));
  places.forEach(p => displayedPlacesMap.set(p.id, p));
  if (openPopupPlace) {
    displayedPlacesMap.set(openPopupPlace.id, openPopupPlace);
  }
  const displayedPlaces = Array.from(displayedPlacesMap.values());

  return (
    <MapContainer 
      center={[50.0614, 19.9365]} // Domyślnie na Kraków ;)
      zoom={6} 
      className={`z-0 ${className}`} 
      zoomControl={false}
    >
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
              <div className="bg-slate-800/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-slate-700 min-w-[240px]">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-white text-base m-0 leading-tight">
                    {place.name}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlace(place);
                    }}
                    className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    {isVisited ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-slate-800" /> Dodano
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-slate-800" /> Dodaj
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}