import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Check, Plus } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';

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
  popupAnchor: [0, -14], // Podniesienie popupa nad pinezkę
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
}

export function TravelMap({ places, visitedPlaces, onTogglePlace, className = "w-full h-full", zoomControl = true }: TravelMapProps) {
  const [openPopupPlace, setOpenPopupPlace] = useState<Place | null>(null);

  const displayedPlacesMap = new Map();
  visitedPlaces.forEach(p => displayedPlacesMap.set(p.id, p));
  places.forEach(p => displayedPlacesMap.set(p.id, p));
  if (openPopupPlace) {
    displayedPlacesMap.set(openPopupPlace.id, openPopupPlace);
  }
  const displayedPlaces = Array.from(displayedPlacesMap.values());

  return (
    <MapContainer 
      center={[50.0614, 19.9365]} 
      zoom={4} 
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
              {/* Ciemny glassmorphism (slate-900/80 + blur) */}
              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-slate-700/50 min-w-[220px] transform transition-all flex items-center justify-between gap-4">
                
                {/* Format: Miasto, Państwo */}
                <span className="font-bold text-white text-sm m-0 leading-tight">
                  {place.displayName || place.name}
                </span>
                
                {/* Neutralny przycisk bez zmiany koloru */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlace(place);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                >
                  {isVisited ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-slate-300" /> 
                      <span>Dodano</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-slate-300" /> 
                      <span>Dodaj</span>
                    </>
                  )}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}