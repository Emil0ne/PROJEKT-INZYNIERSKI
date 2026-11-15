import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, LogOut, Globe2, Trophy, Search, X, MoreHorizontal, Trash2, Sparkles, Map as MapIcon, Calendar, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { TravelMap } from '../components/TravelMap'; 

const INITIAL_TRIPS = [
  {
    id: '1',
    title: 'Włoskie Wakacje',
    location: 'Sycylia, Włochy',
    startDate: '2026-05-25',
    endDate: '2026-05-29',
    days: 5,
    status: 'upcoming',
    imageUrl: 'https://images.unsplash.com/photo-1516483638261-f408892288c6?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '2',
    title: 'Mecz Chelsea',
    location: 'Londyn, UK',
    startDate: '2027-04-10', 
    endDate: '2027-04-12',
    days: 3,
    status: 'upcoming',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'
  }
];

const getDaysUntil = (startDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const diffTime = start.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Dzisiaj';
  if (diffDays === 1) return 'Jutro';
  if (diffDays < 0) return 'Zakończona';
  return `Za ${diffDays} dni`;
};

export function Dashboard() {
  const navigate = useNavigate();
  
  const [trips, setTrips] = useState(INITIAL_TRIPS);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  
  // Stan dla modala nowej podróży (OpenStreetMap API)
  const [planDestination, setPlanDestination] = useState('');
  const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null); // miejsce wybrane z listy podpowiedzi
  const modalSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestId = useRef(0); // chroni przed spóźnionymi odpowiedziami

  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  const [planError, setPlanError] = useState('');
  
  const [visitedPlaces, setVisitedPlaces] = useState([
    { id: 'v1', name: 'Londyn', region: 'UK', type: 'City', displayName: 'Londyn, UK', lat: 51.5074, lng: -0.1278 },
    { id: 'v2', name: 'Wrocław', region: 'Województwo dolnośląskie, Polska', type: 'City', displayName: 'Wrocław, Polska', lat: 51.1079, lng: 17.0385 }
  ]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  
  const todayDate = new Date().toISOString().split('T')[0];

  const citiesCount = visitedPlaces.length;
  const uniqueCountriesCount = new Set(
    visitedPlaces.map(p => {
      const parts = (p.displayName || p.name).split(',');
      return parts[parts.length - 1].trim(); 
    })
  ).size;

  const handleLogout = () => navigate('/');

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

  const selectDestination = (place: any) => {
    setPlanDestination(place.display_name);
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

  const handleAddPlaceFromSearch = (place: any) => {
    const newPlace = {
      id: place.place_id || String(Date.now()),
      name: place.display_name.split(',')[0],
      region: place.display_name,
      type: 'City',
      displayName: place.display_name,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon)
    };
    if (!visitedPlaces.find(p => p.id === newPlace.id)) {
      setVisitedPlaces([...visitedPlaces, newPlace]);
    }
    setSearchQuery('');
  };

  const handleTogglePlaceStatus = (city: any) => {
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
        // Open-Meteo Geocoding: od 3 znaków dopasowuje początek nazwy,
        // ignoruje wielkość liter i polskie znaki, zwraca nazwy po polsku.
        const url =
          `https://geocoding-api.open-meteo.com/v1/search` +
          `?name=${encodeURIComponent(query.trim())}&count=15&language=pl&format=json`;

        const res = await fetch(url);
        const data = await res.json();

        // Jeśli w międzyczasie wpisano coś nowego, ignorujemy tę odpowiedź
        if (requestId !== searchRequestId.current) return;

        const mapped = (data?.results || [])
          // tylko miasta/miejscowości (PPL*), państwa (PCL*) i regiony (ADM1)
          .filter((r: any) => {
            const code: string = r.feature_code || '';
            return !code || code.startsWith('PPL') || code.startsWith('PCL') || code === 'ADM1';
          })
          .map((r: any) => {
            const code: string = r.feature_code || '';
            const kind = code.startsWith('PCL') ? 'country' : code === 'ADM1' ? 'region' : 'city';
            const display_name =
              kind === 'country'
                ? r.name
                : [r.name, r.admin1, r.country]
                    .filter(Boolean)
                    .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i)
                    .join(', ');
            return {
              place_id: String(r.id),
              display_name,
              lat: r.latitude,
              lon: r.longitude,
              kind,
            };
          });

        // Usuwamy duplikaty, kraje wyświetlamy na górze (reszta zostaje w kolejności trafności)
        const unique = mapped.filter(
          (item: any, i: number, arr: any[]) =>
            i === arr.findIndex((t) => t.display_name === item.display_name)
        );
        unique.sort(
          (a: any, b: any) => (a.kind === 'country' ? 0 : 1) - (b.kind === 'country' ? 0 : 1)
        );

        setModalSearchResults(unique.slice(0, 6));
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

    // Cel musi pochodzić z listy podpowiedzi (stąd mamy współrzędne dla mapy w planerze).
    // Jeśli użytkownik tylko wpisał tekst, bierzemy pierwszą podpowiedź.
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
    if (planEndDate < planStartDate) {
      setPlanError('Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.');
      return;
    }
    setIsPlanModalOpen(false);
    
    const params = new URLSearchParams();
    params.set('dest', place.display_name);
    params.set('lat', String(place.lat));
    params.set('lng', String(place.lon));
    params.set('kind', place.kind);
    params.set('start', planStartDate || todayDate);
    params.set('end', planEndDate || todayDate);
    
    setPlanDestination('');
    setPlanStartDate('');
    setPlanEndDate('');
    setFocusedIndex(-1);
    
    navigate(`/planer/nowy?${params.toString()}`); 
  };

  // Wyszukiwarka dla mapy odkrywcy
  const [explorerSearchResults, setExplorerSearchResults] = useState<any[]>([]);
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setExplorerSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=pl`)
        .then(res => res.json())
        .then(data => setExplorerSearchResults(data || []))
        .catch(() => setExplorerSearchResults([]));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col relative">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-sm transition-transform group-hover:scale-105">
              <Globe2 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">TravelPlanner</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 mr-4 border-r border-slate-200 pr-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">E</div>
              <span className="text-sm font-medium text-slate-700">Cześć, Emil</span>
            </div>
            <button onClick={handleLogout} className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors flex items-center gap-2 cursor-pointer">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Wyloguj</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        <div className="space-y-10">
          <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-12 text-center relative overflow-hidden">
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
              <button 
                onClick={() => setIsPlanModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-emerald-200 hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto cursor-pointer"
              >
                <Plus className="w-6 h-6" />
                Rozpocznij planowanie
              </button>
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between mb-8 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Moje podróże</h2>
                <p className="text-slate-500 text-sm mt-1">Ostatnio oglądane i nadchodzące wyjazdy</p>
              </div>
            </div>

            {trips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map((trip, index) => (
                  <motion.div 
                    key={trip.id} 
                    onClick={() => handleTripClick(trip.id)}
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: index * 0.1, duration: 0.4 }} 
                    className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/40 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/60 transition-all group cursor-pointer"
                  >
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
                          <button 
                            onClick={(e) => handleToggleMenu(e, trip.id)}
                            className="p-1.5 rounded-full bg-slate-900/40 text-white hover:bg-slate-900/60 backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeMenuId === trip.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-1 z-20 border border-slate-100"
                            >
                              <button 
                                onClick={(e) => handleDeleteTrip(e, trip.id)}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
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
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 border-dashed p-12 text-center text-slate-500">
                Nie masz jeszcze żadnych zaplanowanych wyjazdów.
              </div>
            )}
          </section>

          <section>
            <div className="flex items-end justify-between mb-8 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <MapIcon className="w-6 h-6 text-emerald-500" />
                  Mapa odkrywcy
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Buduj swój podróżniczy profil. Śledź kraje i miasta, które już udało Ci się odwiedzić.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className={
          isFullscreen 
            ? "fixed inset-0 z-50 bg-slate-100 flex flex-col" 
            : "relative w-full h-[500px] bg-slate-100 rounded-[2rem] overflow-hidden border border-slate-200 shadow-inner z-0 mb-12 mt-8"
        }>
          {isFullscreen && (
            <div className="absolute top-6 right-6 z-[60]">
              <button 
                onClick={() => setIsFullscreen(false)}
                className="bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" /> Zamknij
              </button>
            </div>
          )}

          {isFullscreen ? (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-md z-[60]">
              <div className="relative shadow-2xl rounded-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Wpisz min. 3 znaki, aby szukać..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg border-0"
                />
              </div>
              
              {explorerSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden z-[60] border border-slate-100">
                  {explorerSearchResults.map((place, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleAddPlaceFromSearch(place)}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-sm font-medium text-slate-700 transition-colors border-b border-slate-50 flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">{place.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="absolute top-6 right-6 z-[10]">
              <button 
                onClick={() => setIsFullscreen(true)}
                className="bg-white/95 hover:bg-white text-slate-800 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md border border-slate-100 transition-all hover:shadow-lg cursor-pointer"
              >
                Dodaj odwiedzone miejsca
              </button>
            </div>
          )}

          <div 
            onClick={() => !isFullscreen && setIsFullscreen(true)}
            className={`absolute top-6 left-6 bg-slate-800 text-white rounded-2xl p-4 shadow-xl flex items-center gap-5 backdrop-blur-md bg-slate-800/95 border border-slate-700 z-[10] transition-transform ${!isFullscreen ? 'cursor-pointer hover:scale-105' : ''}`}
          >
            <div className="text-center">
              <div className="text-2xl font-black">{uniqueCountriesCount}</div>
              <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">Kraj</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">{citiesCount}</div>
              <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">Miasto</div>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-600 pl-4 ml-1">
              <div className="bg-amber-400/20 p-1.5 rounded-lg">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <span className="font-medium text-sm">Początkujący<br/>odkrywca</span>
            </div>
          </div>

          <TravelMap 
            key={isFullscreen ? 'fullscreen' : 'windowed'} 
            places={explorerSearchResults}
            visitedPlaces={visitedPlaces}
            onTogglePlace={(place) => handleTogglePlaceStatus(place as any)}
          />

        </div>
      </main>
      
      <div className={isFullscreen ? 'hidden' : 'block'}>
        <Footer />
      </div>

      <AnimatePresence>
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" 
              onClick={() => {
                setIsPlanModalOpen(false);
                setPlanDestination('');
                setPlanStartDate('');
                setPlanEndDate('');
                setPlanError('');
                setFocusedIndex(-1);
              }}
            ></div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl p-8 md:p-12 z-10 overflow-visible"
            >
              <button 
                onClick={() => {
                  setIsPlanModalOpen(false);
                  setPlanDestination('');
                  setPlanStartDate('');
                  setPlanEndDate('');
                  setPlanError('');
                  setFocusedIndex(-1);
                }} 
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer z-50"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-3xl font-black text-slate-900 mb-10 text-center">
                Zaplanuj nową podróż
              </h2>
              
              <div className="space-y-5 relative">
                <div className="relative" ref={dropdownRef}>
                  <div className="border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all bg-white flex items-center relative z-20">
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
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-[70] overflow-hidden max-h-64 overflow-y-auto"
                      >
                        {modalSearchResults.map((place, index) => (
                          <div 
                            key={place.place_id || index}
                            onClick={() => selectDestination(place)}
                            className={`flex items-center justify-between px-5 py-3.5 cursor-pointer border-b border-slate-50 last:border-0 transition-colors ${
                              focusedIndex === index ? 'bg-slate-100' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="pr-4">
                              <div className="font-bold text-slate-900 text-sm">{place.display_name.split(',')[0]}</div>
                              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{place.display_name}</div>
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
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-[70] px-5 py-4 text-sm text-slate-500"
                      >
                        Nie znaleziono pasujących miast ani państw.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="flex flex-col sm:flex-row border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <div 
                    className="relative flex-1 p-2 sm:border-r border-slate-200 focus-within:bg-slate-50 transition-colors group cursor-pointer"
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
                    className="relative flex-1 p-2 border-t sm:border-t-0 border-slate-200 focus-within:bg-slate-50 transition-colors group cursor-pointer"
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
                  <div className="text-red-500 font-bold text-sm text-center pt-2">
                    {planError}
                  </div>
                )}
                
                <div className="pt-6 flex flex-col items-center gap-4">
                  <button 
                    onClick={handleStartPlanning}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-12 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                  >
                    Zacznij planować
                  </button>
                  <button 
                    onClick={() => {
                      setIsPlanModalOpen(false);
                      setPlanDestination('');
                      setPlanStartDate('');
                      setPlanEndDate('');
                      setPlanError('');
                      setFocusedIndex(-1);
                    }}
                    className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}