import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton } from '../ui';
import { LAYER } from '../../lib/layers';
import { searchCities } from '../../lib/geocoding';
import type { GeocodedPlace } from '../../types/place';

interface PlanTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Modal „Zaplanuj nową podróż”: wyszukiwarka celu (z podpowiedziami) + daty, a po zatwierdzeniu przejście do planera. */
export function PlanTripModal({ isOpen, onClose }: PlanTripModalProps) {
  const navigate = useNavigate();

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

  const dropdownRef = useRef<HTMLDivElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const todayDate = new Date().toISOString().split('T')[0];

  // Zamyka modal nowej podróży i czyści jego formularz
  const closePlanModal = () => {
    onClose();
    setPlanDestination('');
    setPlanStartDate('');
    setPlanEndDate('');
    setPlanError('');
    setFocusedIndex(-1);
  };

  // Zamknięcie listy podpowiedzi po kliknięciu poza polem celu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDestinations(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Po zamknięciu modala zapominamy wybrane miejsce
  useEffect(() => {
    if (!isOpen) setSelectedPlace(null);
  }, [isOpen]);

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
    if (!isOpen || !modalRef.current) return;

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
  }, [isOpen]);

  const selectDestination = (place: GeocodedPlace) => {
    setPlanDestination(place.displayName);
    setSelectedPlace(place);
    setShowDestinations(false);
    setFocusedIndex(-1);
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
    
    onClose();
    
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

  return (
      <AnimatePresence>
        {isOpen && (
          <div className={`fixed inset-0 ${LAYER.modal} flex items-center justify-center px-4`}>
            <div
              className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm cursor-pointer"
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
              className="relative bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-xl p-6 md:p-8 z-10 overflow-visible"
            >
              <IconButton
                label="Zamknij"
                round
                onClick={closePlanModal}
                className="absolute top-4 right-4 z-20"
              >
                <X className="w-5 h-5" />
              </IconButton>

              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mb-6">
                Zaplanuj nową podróż
              </h2>

              <div className="space-y-5 relative">
                <div className="relative" ref={dropdownRef}>
                  <div className="border border-stone-300 rounded-lg focus-within:ring-4 focus-within:ring-zinc-900/10 focus-within:border-zinc-900 hover:border-stone-400 transition-colors bg-white flex items-center relative z-20">
                    <div className="pl-4 text-xs font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap flex items-center gap-2">
                      {isModalSearching ? <Loader2 className="w-4 h-4 text-stone-500 animate-spin" /> : null}
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
                      className="w-full py-3 pl-3 pr-4 bg-transparent text-sm text-zinc-900 focus:outline-none placeholder:text-stone-400" 
                    />
                  </div>
                  
                  <AnimatePresence>
                    {showDestinations && planDestination.trim().length >= 3 && modalSearchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        role="listbox"
                        className={`absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-lg shadow-md ${LAYER.dropdown} overflow-hidden max-h-64 overflow-y-auto`}
                      >
                        {modalSearchResults.map((place, index) => (
                          <div 
                            id={`place-option-${index}`}
                            key={place.id}
                            role="option"
                            aria-selected={focusedIndex === index}
                            onClick={() => selectDestination(place)}
                            className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-stone-100 last:border-0 transition-colors ${
                              focusedIndex === index ? 'bg-stone-100' : 'hover:bg-stone-50'
                            }`}
                          >
                            <div className="pr-4">
                              <div className="font-medium text-zinc-900 text-sm">{place.name}</div>
                              <div className="text-xs text-stone-500 mt-0.5 line-clamp-1">{place.displayName}</div>
                            </div>
                            <span className="bg-stone-100 text-stone-600 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
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
                        className={`absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-lg shadow-md ${LAYER.dropdown} px-4 py-3 text-sm text-stone-500`}
                      >
                        Nie znaleziono pasujących miast ani państw.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="flex flex-col sm:flex-row border border-stone-300 rounded-lg overflow-hidden bg-white">
                  <div
                    className="relative flex-1 p-2 sm:border-r border-stone-300 focus-within:bg-stone-50 transition-colors group cursor-pointer"
                    onClick={() => {
                      try {
                        startDateRef.current?.showPicker();
                      } catch (e) {
                        // ignore
                      }
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider pl-3 pt-2 flex items-center gap-1.5 pointer-events-none">
                        <Calendar className="w-3.5 h-3.5" />
                        Data rozpoczęcia
                      </span>
                      <input 
                        ref={startDateRef}
                        type="date"
                        min={todayDate}
                        value={planStartDate}
                        onChange={(e) => setPlanStartDate(e.target.value)}
                        className="w-full bg-transparent px-3 py-1.5 text-sm text-zinc-900 font-medium focus:outline-none cursor-pointer" 
                        onClick={(e) => {
                          try { e.currentTarget.showPicker(); } catch (err) {}
                        }} 
                      />
                    </div>
                  </div>
                  
                  <div 
                    className="relative flex-1 p-2 border-t sm:border-t-0 border-stone-300 focus-within:bg-stone-50 transition-colors group cursor-pointer"
                    onClick={() => {
                      try {
                        endDateRef.current?.showPicker();
                      } catch (e) {
                        // ignore
                      }
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider pl-3 pt-2 flex items-center gap-1.5 pointer-events-none">
                        <Calendar className="w-3.5 h-3.5" />
                        Data zakończenia
                      </span>
                      <input 
                        ref={endDateRef}
                        type="date" 
                        min={planStartDate || todayDate}
                        value={planEndDate}
                        onChange={(e) => setPlanEndDate(e.target.value)}
                        className="w-full bg-transparent px-3 py-1.5 text-sm text-zinc-900 font-medium focus:outline-none cursor-pointer" 
                        onClick={(e) => {
                          try { e.currentTarget.showPicker(); } catch (err) {}
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {planError && (
                  <div role="alert" className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                    {planError}
                  </div>
                )}

                <div className="pt-4 flex items-center justify-end gap-2 flex-row-reverse">
                  <Button onClick={handleStartPlanning}>
                    Zacznij planować
                  </Button>
                  <Button variant="secondary" onClick={closePlanModal}>
                    Anuluj
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
  );
}
