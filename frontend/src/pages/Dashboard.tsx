import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trophy, Search, X, MoreHorizontal, Trash2, Sparkles, Map as MapIcon, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { TravelMap } from '../components/TravelMap';
import { Button, Card, EmptyState, IconButton, Input, SectionHeader } from '../components/ui';
import { LAYER } from '../lib/layers';
import { MOCK_TRIPS, VISITED_PLACES } from '../mocks/trips';
import { getDaysUntil } from '../lib/dates';
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
  
  // Stan dla modala nowej podróży (OpenStreetMap API)
  const [planDestination, setPlanDestination] = useState('');
  const [modalSearchResults, setModalSearchResults] = useState<GeocodedPlace[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedPlace, setSelectedPlace] = useState<GeocodedPlace | null>(null); // miejsce wybrane z listy podpowiedzi
  const modalSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestId = useRef(0); // chroni przed spóźnionymi odpowiedziami

  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  const [planError, setPlanError] = useState('');
  
  const [visitedPlaces, setVisitedPlaces] = useState<Place[]>(VISITED_PLACES);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const todayDate = new Date().toISOString().split('T')[0];

  const citiesCount = visitedPlaces.length;
  const uniqueCountriesCount = new Set(
    visitedPlaces.map(p => {
      const parts = (p.displayName || p.name).split(',');
      return parts[parts.length - 1].trim(); 
    })
  ).size;

  // Zamyka modal nowej podróży i czyści jego formularz
  const closePlanModal = () => {
    setIsPlanModalOpen(false);
    setPlanDestination('');
    setPlanStartDate('');
    setPlanEndDate('');
    setPlanError('');
    setFocusedIndex(-1);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenuId) setActiveMenuId(null);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDestinations(false);
      }
    };
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

  // Po zamknięciu modala zapominamy wybrane miejsce
  useEffect(() => {
    if (!isPlanModalOpen) setSelectedPlace(null);
  }, [isPlanModalOpen]);

  useEffect(() => {
    if (focusedIndex >= 0 && showDestinations) {
      const element = document.getElementById(`place-option-${focusedIndex}`);
      if (element) {
        element.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, showDestinations]);

  // Focus trap dla modala "Zaplanuj nową podróż"
  useEffect(() => {
    if (!isPlanModalOpen || !modalRef.current) return;

    const modalElement = modalRef.current;
    
    // Pobierz wszystkie interaktywne elementy wewnątrz modala
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Automatycznie ustaw focus na pierwszym polu, np. "Dokąd?" po otwarciu
    firstElement.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) { // Nawigacja wstecz (Shift + Tab)
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault(); // Zapobiega domyślnemu wyjściu poza modal
          }
        } else { // Zwykły Tab (do przodu)
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault(); // Zapobiega wyjściu
          }
        }
      }
    };

    modalElement.addEventListener('keydown', handleTab);
    
    return () => {
      modalElement.removeEventListener('keydown', handleTab);
    };
  }, [isPlanModalOpen]);

  const selectDestination = (place: GeocodedPlace) => {
    setPlanDestination(place.displayName);
    setSelectedPlace(place);
    setShowDestinations(false);
    setFocusedIndex(-1);
  };

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

  const handleModalDestinationChange = (query: string) => {
    setPlanDestination(query);
    setSelectedPlace(null); // użytkownik zmienił tekst, więc poprzedni wybór przestaje obowiązywać
    setShowDestinations(true);
    setFocusedIndex(-1);

    if (modalSearchTimeout.current) clearTimeout(modalSearchTimeout.current);

    // Szukamy dopiero od 3 znaków
    if (query.trim().length < 3) {
      searchRequestId.current++; // unieważnij trwające zapytania
      setModalSearchResults([]);
      setIsModalSearching(false);
      return;
    }

    setIsModalSearching(true);
    const requestId = ++searchRequestId.current;

    modalSearchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchCities(query, { limit: 6, destinationMode: true });

        // Jeśli w międzyczasie wpisano coś nowego, ignorujemy tę odpowiedź
        if (requestId !== searchRequestId.current) return;

        setModalSearchResults(results);
      } catch {
        if (requestId === searchRequestId.current) setModalSearchResults([]);
      } finally {
        if (requestId === searchRequestId.current) setIsModalSearching(false);
      }
    }, 300);
  };

  const handleStartPlanning = () => {
    setPlanError('');
    if (!planDestination.trim()) {
      setPlanError('Proszę określić cel podróży.');
      return;
    }

    const place =
      selectedPlace ||
      (!isModalSearching && modalSearchResults.length > 0 ? modalSearchResults[0] : null);
    if (!place) {
      setPlanError('Wybierz miejsce z listy podpowiedzi.');
      return;
    }
    if (!planStartDate || !planEndDate) {
      setPlanError('Proszę wybrać datę rozpoczęcia i zakończenia podróży.');
      return;
    }

    if (planStartDate < todayDate) {
      setPlanError('Data rozpoczęcia nie może być datą z przeszłości.');
      return;
    }

    if (planEndDate < planStartDate) {
      setPlanError('Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.');
      return;
    }
    
    setIsPlanModalOpen(false);
    
    const params = new URLSearchParams();
    params.set('dest', place.displayName);
    params.set('lat', String(place.lat));
    params.set('lng', String(place.lng));
    params.set('kind', place.kind);
    params.set('start', planStartDate || todayDate);
    params.set('end', planEndDate || todayDate);
    
    setPlanDestination('');
    setPlanStartDate('');
    setPlanEndDate('');
    setFocusedIndex(-1);
    
    navigate(`/planer/nowy?${params.toString()}`); 
  };

  // Wyszukiwarka dla mapy odkrywcy (teraz na Open-Meteo)
  const [explorerSearchResults, setExplorerSearchResults] = useState<GeocodedPlace[]>([]);
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setExplorerSearchResults([]);
      return;
    }
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col relative">
      <AppHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        <div className="space-y-10">
          <Card glass padding="none" className="p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-slate-50/50 z-0"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center p-4 bg-emerald-100 rounded-full mb-6">
                <Sparkles className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
                Gdzie ruszamy tym razem?
              </h1>
              <p className="text-slate-500 text-lg mb-8">
                Świat stoi otworem. Wygeneruj spersonalizowany plan podróży z pomocą AI lub zaplanuj wszystko krok po kroku samodzielnie.
              </p>
              <Button size="lg" onClick={() => setIsPlanModalOpen(true)} className="mx-auto gap-3">
                <Plus className="w-6 h-6" />
                Rozpocznij planowanie
              </Button>
            </div>
          </Card>

          <section>
            <SectionHeader
              size="sm"
              align="left"
              bordered
              className="mb-8"
              title="Moje podróże"
              description="Ostatnio oglądane i nadchodzące wyjazdy"
            />

            {trips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    onClick={() => handleTripClick(trip.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                  <Card padding="none" hoverable className="overflow-hidden group cursor-pointer">
                    <div className="h-48 relative overflow-hidden">
                      <img src={trip.imageUrl} alt={trip.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                      
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-white/90 text-slate-800 shadow-sm">
                          {getDaysUntil(trip.startDate)}
                        </span>
                      </div>

                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <div className="relative">
                          <IconButton
                            label="Opcje podróży"
                            variant="overlay"
                            round
                            onClick={(e) => handleToggleMenu(e, trip.id)}
                            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </IconButton>

                          {activeMenuId === trip.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-1 ${LAYER.dropdown} border border-slate-200/80`}
                            >
                              <button
                                onClick={(e) => handleDeleteTrip(e, trip.id)}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                                Przenieś do kosza
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="text-xl font-bold mb-1">{trip.title}</h3>
                        <div className="flex items-center gap-1.5 text-slate-200 text-sm">
                          <MapPin className="w-4 h-4" /> {trip.location}
                        </div>
                      </div>
                    </div>
                  </Card>
                  </motion.div>
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

          <SectionHeader
            size="sm"
            align="left"
            bordered
            className="mb-8"
            icon={<MapIcon />}
            title="Mapa odkrywcy"
            description="Buduj swój podróżniczy profil. Śledź kraje i miasta, które już udało Ci się odwiedzić."
          />
        </div>

        <div className={
          isFullscreen 
            ? `fixed inset-0 ${LAYER.fullscreen} bg-slate-100 flex flex-col`
            : "relative w-full h-[500px] bg-slate-100 rounded-[2rem] overflow-hidden border border-slate-200/80 shadow-sm z-0 mb-12 mt-8"
        }>
          {isFullscreen && (
            <div className={`absolute top-6 right-6 ${LAYER.floating}`}>
              <Button variant="secondary" size="sm" onClick={() => setIsFullscreen(false)} className="shadow-lg">
                <X className="w-4 h-4" /> Zamknij
              </Button>
            </div>
          )}

          {isFullscreen ? (
            <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-md ${LAYER.floating}`}>
              <Input
                type="text"
                aria-label="Szukaj miasta lub kraju"
                icon={<Search />}
                placeholder="Wpisz min. 3 znaki, aby szukać..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="shadow-lg font-medium"
              />

              {explorerSearchResults.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden ${LAYER.dropdown} border border-slate-200/80`}>
                  {explorerSearchResults.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => handleAddPlaceFromSearch(place)}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-sm font-medium text-slate-700 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">{place.displayName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="absolute top-6 right-6 z-[10]">
              <Button variant="secondary" size="sm" onClick={() => setIsFullscreen(true)}>
                Dodaj odwiedzone miejsca
              </Button>
            </div>
          )}

          <div
            onClick={() => !isFullscreen && setIsFullscreen(true)}
            className={`absolute top-6 left-6 bg-white/90 text-slate-900 rounded-2xl p-4 shadow-lg flex items-center gap-5 backdrop-blur-lg border border-slate-200/80 z-[10] transition-transform ${!isFullscreen ? 'cursor-pointer hover:scale-105' : ''}`}
          >
            <div className="text-center">
              <div className="text-2xl font-black">{uniqueCountriesCount}</div>
              <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">Kraj</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">{citiesCount}</div>
              <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">Miasto</div>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-1">
              <div className="bg-amber-100 p-1.5 rounded-lg">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <span className="font-medium text-sm text-slate-700">Początkujący<br/>odkrywca</span>
            </div>
          </div>

          <TravelMap 
            key={isFullscreen ? 'fullscreen' : 'windowed'} 
            places={[]} 
            visitedPlaces={visitedPlaces}
            onTogglePlace={handleTogglePlaceStatus}
          />

        </div>
      </main>
      
      <div className={isFullscreen ? 'hidden' : 'block'}>
        <Footer />
      </div>

      <AnimatePresence>
        {isPlanModalOpen && (
          <div className={`fixed inset-0 ${LAYER.modal} flex items-center justify-center px-4`}>
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
              onClick={closePlanModal}
            ></div>

            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label="Zaplanuj nową podróż"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] border border-slate-200/80 shadow-2xl w-full max-w-2xl p-8 md:p-12 z-10 overflow-visible"
            >
              <IconButton
                label="Zamknij"
                round
                onClick={closePlanModal}
                className="absolute top-6 right-6 p-2 z-20"
              >
                <X className="w-6 h-6" />
              </IconButton>

              <h2 className="text-3xl font-black text-slate-900 mb-10 text-center">
                Zaplanuj nową podróż
              </h2>

              <div className="space-y-5 relative">
                <div className="relative" ref={dropdownRef}>
                  <div className="border border-slate-200/80 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 hover:border-slate-300 transition-all bg-white flex items-center relative z-20">
                    <div className="pl-5 font-bold text-slate-800 text-sm whitespace-nowrap flex items-center gap-2">
                      {isModalSearching ? <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /> : null}
                      Dokąd?
                    </div>
                    <input 
                      type="text" 
                      value={planDestination}
                      onChange={(e) => handleModalDestinationChange(e.target.value)}
                      onFocus={() => setShowDestinations(true)}
                      onKeyDown={(e) => {
                        if (!showDestinations || modalSearchResults.length === 0) return;
                        
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setFocusedIndex(prev => (prev < modalSearchResults.length - 1 ? prev + 1 : prev));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (focusedIndex >= 0 && focusedIndex < modalSearchResults.length) {
                            selectDestination(modalSearchResults[focusedIndex]);
                          } else if (modalSearchResults.length > 0) {
                            selectDestination(modalSearchResults[0]);
                          }
                        } else if (e.key === 'Escape') {
                          setShowDestinations(false);
                        }
                      }}
                      aria-label="Cel podróży"
                      placeholder="Wpisz min. 3 znaki (np. Warszawa, Tokio)..."
                      className="w-full py-4 pl-4 pr-4 bg-transparent text-slate-900 focus:outline-none font-medium placeholder:font-normal placeholder:text-slate-400" 
                    />
                  </div>
                  
                  <AnimatePresence>
                    {showDestinations && planDestination.trim().length >= 3 && modalSearchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        role="listbox"
                        className={`absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl ${LAYER.dropdown} overflow-hidden max-h-64 overflow-y-auto`}
                      >
                        {modalSearchResults.map((place, index) => (
                          <div 
                            id={`place-option-${index}`}
                            key={place.id}
                            role="option"
                            aria-selected={focusedIndex === index}
                            onClick={() => selectDestination(place)}
                            className={`flex items-center justify-between px-5 py-3.5 cursor-pointer border-b border-slate-100 last:border-0 transition-colors ${
                              focusedIndex === index ? 'bg-emerald-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="pr-4">
                              <div className="font-bold text-slate-900 text-sm">{place.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{place.displayName}</div>
                            </div>
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider shrink-0">
                              {place.kind === 'country' ? 'Kraj' : place.kind === 'region' ? 'Region' : 'Miasto'}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {showDestinations &&
                      planDestination.trim().length >= 3 &&
                      !isModalSearching &&
                      modalSearchResults.length === 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl ${LAYER.dropdown} px-5 py-4 text-sm text-slate-500`}
                      >
                        Nie znaleziono pasujących miast ani państw.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="flex flex-col sm:flex-row border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
                  <div
                    className="relative flex-1 p-2 sm:border-r border-slate-200/80 focus-within:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => {
                      try {
                        startDateRef.current?.showPicker();
                      } catch (e) {
                        // ignore
                      }
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-3 pt-2 flex items-center gap-1.5 pointer-events-none">
                        <Calendar className="w-3.5 h-3.5" />
                        Data rozpoczęcia
                      </span>
                      <input 
                        ref={startDateRef}
                        type="date"
                        min={todayDate}
                        value={planStartDate}
                        onChange={(e) => setPlanStartDate(e.target.value)}
                        className="w-full bg-transparent px-3 py-1.5 text-slate-900 font-bold focus:outline-none cursor-pointer" 
                        onClick={(e) => {
                          try { e.currentTarget.showPicker(); } catch (err) {}
                        }} 
                      />
                    </div>
                  </div>
                  
                  <div 
                    className="relative flex-1 p-2 border-t sm:border-t-0 border-slate-200/80 focus-within:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => {
                      try {
                        endDateRef.current?.showPicker();
                      } catch (e) {
                        // ignore
                      }
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-3 pt-2 flex items-center gap-1.5 pointer-events-none">
                        <Calendar className="w-3.5 h-3.5" />
                        Data zakończenia
                      </span>
                      <input 
                        ref={endDateRef}
                        type="date" 
                        min={planStartDate || todayDate}
                        value={planEndDate}
                        onChange={(e) => setPlanEndDate(e.target.value)}
                        className="w-full bg-transparent px-3 py-1.5 text-slate-900 font-bold focus:outline-none cursor-pointer" 
                        onClick={(e) => {
                          try { e.currentTarget.showPicker(); } catch (err) {}
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {planError && (
                  <div role="alert" className="p-3 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl text-center">
                    {planError}
                  </div>
                )}

                <div className="pt-6 flex flex-col items-center gap-4">
                  <Button pill size="lg" onClick={handleStartPlanning} className="px-12">
                    Zacznij planować
                  </Button>
                  <Button variant="ghost" size="sm" onClick={closePlanModal}>
                    Anuluj
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}