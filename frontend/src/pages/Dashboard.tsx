import { useState, useEffect } from 'react';
import { Plus, Trophy, Search, X, Map as MapIcon, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { TravelMap } from '../components/TravelMap';
import { TripCard } from '../components/dashboard/TripCard';
import { PlanTripModal } from '../components/dashboard/PlanTripModal';
import { Button, Card, EmptyState, Input } from '../components/ui';
import { LAYER } from '../lib/layers';
import { MOCK_TRIPS, VISITED_PLACES } from '../mocks/trips';
import { searchCities } from '../lib/geocoding';
import type { GeocodedPlace, Place } from '../types/place';
import type { TripSummary } from '../types/trip';

export function Dashboard() {
  const navigate = useNavigate();
  
  const [trips, setTrips] = useState<TripSummary[]>(MOCK_TRIPS);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  
  const [visitedPlaces, setVisitedPlaces] = useState<Place[]>(VISITED_PLACES);
  
  const citiesCount = visitedPlaces.length;
  const uniqueCountriesCount = new Set(
    visitedPlaces.map(p => {
      const parts = (p.displayName || p.name).split(',');
      return parts[parts.length - 1].trim(); 
    })
  ).size;

  // Kliknięcie gdziekolwiek zamyka otwarte menu opcji podróży
  useEffect(() => {
    if (!activeMenuId) return;
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  useEffect(() => {
    if (isFullscreen || isPlanModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isFullscreen, isPlanModalOpen]);

  const handleToggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleDeleteTrip = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTrips(trips.filter(t => t.id !== id));
    setActiveMenuId(null);
  };

  const handleTripClick = (tripId: string) => {
    navigate(`/planer/${tripId}`);
  };

  const handleAddPlaceFromSearch = (place: GeocodedPlace) => {
    const newPlace: Place = {
      id: place.id,
      name: place.name,
      displayName: place.displayName,
      lat: place.lat,
      lng: place.lng
    };
    if (!visitedPlaces.find(p => p.id === newPlace.id)) {
      setVisitedPlaces([...visitedPlaces, newPlace]);
    }
    setSearchQuery('');
  };

  const handleTogglePlaceStatus = (city: Place) => {
    const isVisited = visitedPlaces.some(p => p.id === city.id);
    if (isVisited) {
      setVisitedPlaces(visitedPlaces.filter(p => p.id !== city.id));
    } else {
      setVisitedPlaces([...visitedPlaces, city]);
    }
  };

  // Wyszukiwarka dla mapy odkrywcy (teraz na Open-Meteo)
  const [foundPlaces, setExplorerSearchResults] = useState<GeocodedPlace[]>([]);
  const explorerSearchResults = searchQuery.trim().length < 3 ? [] : foundPlaces;
  useEffect(() => {
    if (searchQuery.trim().length < 3) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      // Tylko nazwa i kraj (bez regionu)
      searchCities(searchQuery, { limit: 6 })
        .then(results => { if (!cancelled) setExplorerSearchResults(results); })
        .catch(() => { if (!cancelled) setExplorerSearchResults([]); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-zinc-900 flex flex-col relative">
      <AppHeader />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEWA KOLUMNA: wyjazdy + szybkie akcje */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Moje podróże</h1>
                <p className="text-sm text-stone-600 mt-1">Ostatnio oglądane i nadchodzące wyjazdy</p>
              </div>
              <Button onClick={() => setIsPlanModalOpen(true)} className="shrink-0">
                <Plus className="w-4 h-4" />
                Nowa podróż
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Wyjazdy', value: trips.length },
                { label: 'Kraje', value: uniqueCountriesCount },
                { label: 'Miasta', value: citiesCount },
              ].map((s) => (
                <Card key={s.label} padding="sm" className="!py-3">
                  <div className="text-2xl font-semibold tracking-tight tabular-nums text-zinc-900">{s.value}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mt-0.5">{s.label}</div>
                </Card>
              ))}
            </div>

            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Wyjazdy</p>

              {trips.length > 0 ? (
                <div className="space-y-3">
                  {trips.map((trip, index) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      index={index}
                      isMenuOpen={activeMenuId === trip.id}
                      onOpen={handleTripClick}
                      onToggleMenu={handleToggleMenu}
                      onDelete={handleDeleteTrip}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<MapPin />}
                  title="Nie masz jeszcze żadnych zaplanowanych wyjazdów."
                  action={<Button size="sm" onClick={() => setIsPlanModalOpen(true)}><Plus className="w-4 h-4" /> Rozpocznij planowanie</Button>}
                />
              )}
            </section>
          </div>

          {/* PRAWA KOLUMNA: mapa odwiedzonych miejsc */}
          <div className="lg:col-span-7 xl:col-span-8 min-w-0 lg:sticky lg:top-[4.75rem]">
            <div className={
              isFullscreen
                ? `fixed inset-x-0 bottom-0 top-14 ${LAYER.fullscreen} bg-stone-100 flex flex-col`
                : 'relative w-full h-[420px] lg:h-[calc(100vh-7rem)] bg-stone-100 rounded-xl overflow-hidden border border-stone-200 shadow-xs z-0'
            }>
              {isFullscreen && (
                <div className={`absolute top-4 right-4 ${LAYER.floating}`}>
                  <Button variant="primary" onClick={() => setIsFullscreen(false)} aria-label="Zamknij pełny ekran mapy" className="shadow-sm">
                    <X className="w-4 h-4" /> Zamknij
                  </Button>
                </div>
              )}

              {isFullscreen ? (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 ${LAYER.floating}`}>
                  <Input
                    type="text"
                    aria-label="Szukaj miasta lub kraju"
                    icon={<Search />}
                    placeholder="Wpisz min. 3 znaki, aby szukać..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="shadow-sm"
                  />

                  {explorerSearchResults.length > 0 && (
                    <div className={`absolute top-full left-4 right-4 mt-2 bg-white rounded-lg shadow-md overflow-hidden ${LAYER.dropdown} border border-stone-200`}>
                      {explorerSearchResults.map((place) => (
                        <button
                          key={place.id}
                          onClick={() => handleAddPlaceFromSearch(place)}
                          className="w-full text-left px-4 py-2.5 hover:bg-stone-50 text-sm text-zinc-800 transition-colors border-b border-stone-100 last:border-0 flex items-center gap-2 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{place.displayName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute top-4 right-4 z-[10]">
                  <Button variant="secondary" size="sm" onClick={() => setIsFullscreen(true)}>
                    <MapIcon className="w-4 h-4" />
                    Dodaj odwiedzone miejsca
                  </Button>
                </div>
              )}

              <div
                onClick={() => !isFullscreen && setIsFullscreen(true)}
                className={`absolute top-4 left-4 bg-white text-zinc-900 rounded-lg px-4 py-3 shadow-sm flex items-center gap-4 border border-stone-200 z-[10] ${!isFullscreen ? 'cursor-pointer hover:border-stone-300' : ''}`}
              >
                <div className="text-center">
                  <div className="text-xl font-semibold tabular-nums">{uniqueCountriesCount}</div>
                  <div className="text-[10px] font-semibold tracking-wider text-stone-500 uppercase">Kraj</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold tabular-nums">{citiesCount}</div>
                  <div className="text-[10px] font-semibold tracking-wider text-stone-500 uppercase">Miasto</div>
                </div>
                <div className="flex items-center gap-2 border-l border-stone-200 pl-4">
                  <Trophy className="w-4 h-4 text-stone-500" />
                  <span className="text-xs text-stone-600 leading-tight">Początkujący<br/>odkrywca</span>
                </div>
              </div>

              <TravelMap
                key={isFullscreen ? 'fullscreen' : 'windowed'}
                places={[]}
                visitedPlaces={visitedPlaces}
                onTogglePlace={handleTogglePlaceStatus}
              />
            </div>
          </div>
        </div>
      </main>

      <div className={isFullscreen ? 'hidden' : 'block'}>
        <Footer />
      </div>

      <PlanTripModal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} />
    </div>
  );
}