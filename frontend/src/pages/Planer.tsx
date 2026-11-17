import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import { MapPin, Search, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// DND-KIT IMPORTS
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { TravelMap } from '../components/TravelMap';
import { AppHeader } from '../components/AppHeader';
import { PlanerSidebar } from '../components/planer/PlanerSidebar';
import { DayScheduleView, type ScheduleItemChanges } from '../components/planer/DayScheduleView';
import { PackingView } from '../components/planer/PackingView';
import { Input } from '../components/ui';
import { LAYER } from '../lib/layers';
import { OverviewView } from './OverviewView';
import { BudgetView } from './BudgetView';
import { FlightsAndHotelView } from './FlightsAndHotelView';
import { DEFAULT_BUDGET_ITEMS, DEFAULT_PACKING_ITEMS, getTripById } from '../mocks/trips';
import { DEFAULT_CENTER, DEFAULT_CURRENCY, DEFAULT_PIN_COLOR, DEFAULT_TOTAL_BUDGET } from '../lib/constants';
import { generateTripDays } from '../lib/dates';
import { biasDeltaForZoom, geocodeAddress, reverseGeocode, searchPlaces, zoomForKind } from '../lib/geocoding';
import type { BudgetItem } from '../types/budget';
import type { ClickedPoint, GeocodedPlace, Place } from '../types/place';
import type { PackingItem, ScheduleItem, TripDay } from '../types/trip';

// --- GŁÓWNY KOMPONENT ---
export function Planer() {
  const { id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const isNew = id === 'nowy';
  // Dane wybranej podróży (do czasu podpięcia REST API – z mocków); dla 'nowy' – z parametrów URL.
  const trip = isNew ? undefined : getTripById(id);

  const tripDestination = trip ? trip.location : (searchParams.get('dest') || 'Kraków, Polska');
  const tripTitle = trip ? trip.title : `Wyjazd: ${tripDestination.split(',')[0]}`;
  const currency = trip?.currency ?? DEFAULT_CURRENCY;
  const startDate = trip ? trip.startDate : searchParams.get('start');
  const endDate = trip ? trip.endDate : searchParams.get('end');

  const destLat = trip ? trip.lat : parseFloat(searchParams.get('lat') ?? '');
  const destLng = trip ? trip.lng : parseFloat(searchParams.get('lng') ?? '');
  const destZoom = trip ? trip.zoom : zoomForKind(searchParams.get('kind'));
  const hasDestCoords = !isNaN(destLat) && !isNaN(destLng);

  const [tripDays, setTripDays] = useState<TripDay[]>(() => {
    if (trip && trip.days.length > 0) return trip.days;
    return generateTripDays(startDate, endDate);
  });

  const [activeSection, setActiveSection] = useState<string>('d1'); 
  const [mapCenter, setMapCenter] = useState<[number, number]>(hasDestCoords ? [destLat, destLng] : DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(4);
  const [isMapVisible, setIsMapVisible] = useState(true);
  
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placeRequestId = useRef(0);
  const searchBias = useRef<{ lat: number; lng: number; delta: number } | null>(null);

  const [clickedMapPoint, setClickedMapPoint] = useState<ClickedPoint | null>(null);

  const [totalBudget, setTotalBudget] = useState<number>(trip?.budget ?? DEFAULT_TOTAL_BUDGET);
  const [customBudgetItems, setCustomBudgetItems] = useState<BudgetItem[]>(DEFAULT_BUDGET_ITEMS);

  const [packingItems, setPackingItems] = useState<PackingItem[]>(DEFAULT_PACKING_ITEMS);

  const isScheduleMode = activeSection.startsWith('d');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Aktualnie przeciągana atrakcja (null, gdy przeciągamy dzień lub nic) + dzień-cel upuszczenia
  const [draggedItem, setDraggedItem] = useState<{ item: ScheduleItem; dayId: string } | null>(null);
  const [dropTargetDayId, setDropTargetDayId] = useState<string | null>(null);

  const moveScheduleItem = (fromDayId: string, itemId: string, toDayId: string) => {
    if (fromDayId === toDayId) return;
    setTripDays(prevDays => {
      const item = prevDays.find(d => d.id === fromDayId)?.items.find(i => i.id === itemId);
      if (!item || !prevDays.some(d => d.id === toDayId)) return prevDays;
      return prevDays.map(day => {
        if (day.id === fromDayId) return { ...day, items: day.items.filter(i => i.id !== itemId) };
        if (day.id === toDayId) return { ...day, items: [...day.items, item] };
        return day;
      });
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === 'item') {
      const dayId = String(data.dayId);
      const item = tripDays.find(d => d.id === dayId)?.items.find(i => i.id === event.active.id);
      setDraggedItem(item ? { item, dayId } : null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (active.data.current?.type !== 'item') return;
    const isValidTarget = over?.data.current?.type === 'day' && over.id !== active.data.current.dayId;
    setDropTargetDayId(isValidTarget && over ? String(over.id) : null);
  };

  const handleDragCancel = () => {
    setDraggedItem(null);
    setDropTargetDayId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);
    setDropTargetDayId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Atrakcja upuszczona na dzień w panelu bocznym → przenieś na koniec tego dnia
    if (activeType === 'item' && overType === 'day') {
      moveScheduleItem(String(active.data.current?.dayId), activeId, overId);
      return;
    }

    // Dzień przeciągnięty nad atrakcję (lub odwrotnie) – ignorujemy
    if (activeType !== overType) return;

    if (activeType === 'day') {
      if (activeId !== overId) {
        setTripDays((items) => {
          const oldIndex = items.findIndex(d => d.id === activeId);
          const newIndex = items.findIndex(d => d.id === overId);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
      return;
    }

    setTripDays((items) => {
      return items.map(day => {
        if (day.id === activeSection) {
          const oldIndex = day.items.findIndex(i => i.id === activeId);
          const newIndex = day.items.findIndex(i => i.id === overId);
          if (oldIndex !== -1 && newIndex !== -1) {
            return { ...day, items: arrayMove(day.items, oldIndex, newIndex) };
          }
        }
        return day;
      });
    });
  };

  useEffect(() => {
    if (hasDestCoords) {
      setMapCenter([destLat, destLng]);
      setMapZoom(destZoom);
      searchBias.current = { lat: destLat, lng: destLng, delta: biasDeltaForZoom(destZoom) };
      return;
    }

    if (!tripDestination) return;
    let cancelled = false;
    geocodeAddress(tripDestination)
      .then((place) => {
        if (cancelled || !place) return;
        const zoom = place.kind === 'country' ? 5 : 11;
        setMapCenter([place.lat, place.lng]);
        setMapZoom(zoom);
        searchBias.current = { lat: place.lat, lng: place.lng, delta: biasDeltaForZoom(zoom) };
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [destLat, destLng, destZoom, tripDestination]);

  const handleSearchPlace = (query: string) => {
    setPlaceQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    const requestId = ++placeRequestId.current;
    
    if (query.trim().length < 3) {
      setPlaceResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(query, { limit: 6, bias: searchBias.current });
        if (requestId !== placeRequestId.current) return;
        setPlaceResults(results);
      } catch {
        if (requestId === placeRequestId.current) setPlaceResults([]);
      } finally {
        if (requestId === placeRequestId.current) setIsSearching(false);
      }
    }, 500);
  };

  const addItemToActiveDay = (placeName: string, lat: number, lng: number) => {
    if (!activeSection.startsWith('d')) return; 
    
    const newItem: ScheduleItem = {
      id: `i${Date.now()}`,
      title: placeName,
      time: '12:00',
      type: 'activity',
      lat,
      lng,
      cost: 0
    };

    setTripDays(prevDays => prevDays.map(day => {
      if (day.id === activeSection) {
        return { ...day, items: [...day.items, newItem] };
      }
      return day;
    }));
  };

  const handleAddPlaceFromSearch = (place: GeocodedPlace) => {
    const { lat, lng } = place;
    if (isNaN(lat) || isNaN(lng)) return;

    const placeName = place.displayName ? place.name : 'Wybrane miejsce';
    addItemToActiveDay(placeName, lat, lng);
    setPlaceQuery('');
    setPlaceResults([]);
    setMapCenter([lat, lng]);
    setMapZoom(15); 
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (!activeSection.startsWith('d')) return; 
    setClickedMapPoint({ lat, lng, name: '', isLoading: true });

    try {
      const placeName = await reverseGeocode(lat, lng);
      setClickedMapPoint({ lat, lng, name: placeName, isLoading: false });
    } catch {
      setClickedMapPoint({ lat, lng, name: 'Wybrana lokalizacja', isLoading: false });
    }
  };

  const handleAddClickedPointToPlan = () => {
    if (clickedMapPoint && !clickedMapPoint.isLoading) {
      addItemToActiveDay(clickedMapPoint.name, clickedMapPoint.lat, clickedMapPoint.lng);
      setClickedMapPoint(null);
    }
  };

  const updateScheduleItem = (dayId: string, itemId: string, changes: ScheduleItemChanges) => {
    setTripDays(prevDays => prevDays.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          items: day.items.map(item => item.id === itemId ? { ...item, ...changes } : item)
        };
      }
      return day;
    }));
  };

  const deleteScheduleItem = (dayId: string, itemId: string) => {
    setTripDays(prevDays => prevDays.map(day => {
      if (day.id === dayId) {
        return { ...day, items: day.items.filter(item => item.id !== itemId) };
      }
      return day;
    }));
  };

  const renameDay = (dayId: string, title: string) => {
    setTripDays(prevDays => prevDays.map(day => day.id === dayId ? { ...day, customTitle: title } : day));
  };

  const changeDayColor = (dayId: string, color: string) => {
    setTripDays(prevDays => prevDays.map(day => {
      if (day.id === dayId) {
        return { ...day, color };
      }
      return day;
    }));
  };

  const togglePackingItem = (id: string) => setPackingItems(items => items.map(item => item.id === id ? { ...item, packed: !item.packed } : item));
  const deletePackingItem = (id: string) => setPackingItems(items => items.filter(item => item.id !== id));
  const addPackingItem = (text: string) => setPackingItems(items => [...items, { id: String(Date.now()), text, packed: false }]);

  // ZBIERAMY WSZYSTKIE PINEZKI ZE WSZYSTKICH DNI DO WYŚWIETLENIA NA MAPIE
  const allMapPlaces: Place[] = tripDays.flatMap(day =>
    day.items.map(item => ({
      id: item.id,
      name: item.title,
      displayName: `${item.time} - ${item.title} (${day.customTitle || `Dzień ${day.dayNumber}`})`,
      lat: item.lat,
      lng: item.lng,
      color: day.color || DEFAULT_PIN_COLOR
    }))
  );

  // Nieznane id podróży → wracamy do listy
  if (!isNew && !trip) return <Navigate to="/dashboard" replace />;

  const currentDay = tripDays.find(d => d.id === activeSection);

  // Funkcja centrowania mapy na wybranej atrakcji po kliknięciu
  const handleFocusOnMap = (lat: number, lng: number) => {
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
      setMapZoom(15); // Dokładne przybliżenie na atrakcję
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#FAF9F6] overflow-hidden font-sans text-zinc-900">
      
      <AppHeader
        layout="workspace"
        backTo="/dashboard"
        title={tripTitle}
        subtitle={<span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-600" /> {tripDestination}</span>}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
        {/* Overlay, bo oś czasu ma overflow i przycięłaby przeciąganą kartę nad panelem bocznym */}
        <DragOverlay dropAnimation={null}>
          {draggedItem && (
            <div className="px-3 py-2 rounded-lg bg-white shadow-lg border border-stone-300 text-sm cursor-grabbing">
              <div className="font-medium text-zinc-900">{draggedItem.item.title}</div>
              <div className="text-xs text-stone-500 tabular-nums">{draggedItem.item.time}</div>
            </div>
          )}
        </DragOverlay>
        <div className="flex-1 flex overflow-hidden relative">

          <PlanerSidebar
            dropTargetDayId={dropTargetDayId}
            isDraggingItem={!!draggedItem}
            tripDays={tripDays}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onFocusOnMap={handleFocusOnMap}
          />

          <div className="flex-1 bg-[#FAF9F6] flex flex-col h-full min-w-[400px] relative z-20 overflow-x-hidden">
            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
              {isScheduleMode && (
                <div className="p-3 border-b border-stone-200 bg-white shrink-0 relative">
                  <Input
                    type="text"
                    aria-label="Szukaj miejsc"
                    icon={isSearching ? <Loader2 className="text-stone-500 animate-spin" /> : <Search />}
                    value={placeQuery}
                    onChange={(e) => handleSearchPlace(e.target.value)}
                    placeholder="Szukaj miejsc lub dodawaj je klikając na mapie..."
                  />

                  {placeResults.length > 0 && placeQuery.trim() !== '' && (
                    <div className={`absolute top-full left-3 right-3 mt-1 bg-white rounded-lg shadow-md border border-stone-200 overflow-hidden max-h-[300px] overflow-y-auto ${LAYER.dropdown}`}>
                      {placeResults.map((place) => (
                        <button
                          key={place.id}
                          onClick={() => handleAddPlaceFromSearch(place)}
                          className="w-full text-left px-4 py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors flex items-start gap-3 group cursor-pointer"
                        >
                          <div className="bg-stone-100 p-1.5 rounded-md text-stone-500 group-hover:text-emerald-600 transition-colors mt-0.5 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-zinc-900 text-sm">
                              {place.name}
                            </div>
                            <div className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                              {place.displayName}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="h-full"
                  >
                    {activeSection === 'overview' ? (
                      <OverviewView 
                        tripTitle={tripTitle} 
                        destination={tripDestination} 
                        startDate={startDate ?? ''}
                        endDate={endDate ?? ''}
                        totalDays={tripDays.length}
                        totalBudget={totalBudget}
                        currency={currency}
                        customItems={customBudgetItems}
                        scheduleItems={tripDays.flatMap(day => day.items)}
                        packingItemsCount={packingItems.length}
                        packedItemsCount={packingItems.filter(i => i.packed).length}
                      />
                    ) : activeSection === 'flights-hotel' ? (
                      <FlightsAndHotelView customItems={customBudgetItems} setCustomItems={setCustomBudgetItems} currency={currency} />
                    ) : activeSection === 'budget' ? (
                      <BudgetView tripId={trip?.id} currency={currency} budget={totalBudget} setBudget={setTotalBudget} customItems={customBudgetItems} setCustomItems={setCustomBudgetItems} scheduleItems={tripDays.flatMap(day => day.items)} />
                    ) : activeSection === 'packing' ? (
                      <PackingView items={packingItems} onToggle={togglePackingItem} onDelete={deletePackingItem} onAdd={addPackingItem} />
                    ) : activeSection.startsWith('d') && currentDay ? (
                      <DayScheduleView
                        key={currentDay.id}
                        day={currentDay}
                        otherDays={tripDays.filter(d => d.id !== currentDay.id).map(d => ({ id: d.id, label: `${d.customTitle || `Dzień ${d.dayNumber}`} (${d.date})` }))}
                        onMoveItem={moveScheduleItem}
                        currency={currency}
                        onFocusOnMap={handleFocusOnMap}
                        onUpdateItem={updateScheduleItem}
                        onDeleteItem={deleteScheduleItem}
                        onRenameDay={renameDay}
                        onChangeColor={changeDayColor}
                      />
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {isScheduleMode && (
              <button onClick={() => setIsMapVisible(!isMapVisible)} aria-label={isMapVisible ? "Ukryj mapę" : "Pokaż mapę"} className={`absolute right-[-14px] top-1/2 -translate-y-1/2 ${LAYER.floating} bg-white border border-stone-200 shadow-sm p-1.5 rounded-full text-stone-500 hover:text-zinc-900 hover:border-stone-300 transition-colors cursor-pointer`} title={isMapVisible ? "Ukryj mapę" : "Pokaż mapę"}>
                {isMapVisible ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            )}
          </div>

          <AnimatePresence initial={false}>
            {isScheduleMode && isMapVisible && (
              <motion.div initial={{ width: 0, minWidth: 0, opacity: 0 }} animate={{ width: '45%', minWidth: '380px', opacity: 1 }} exit={{ width: 0, minWidth: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="border-l border-stone-200 relative bg-stone-200 shrink-0 z-10 overflow-hidden h-full flex flex-col">
                <div className="w-full h-full min-w-[380px]">
                  <TravelMap 
                    places={allMapPlaces} 
                    visitedPlaces={[]} 
                    onTogglePlace={() => {}} 
                    className="w-full h-full" 
                    center={mapCenter} 
                    zoom={mapZoom} 
                    isPlannerMode={true} 
                    onMapClick={handleMapClick} 
                    clickedPoint={clickedMapPoint} 
                    onAddClickedPoint={handleAddClickedPointToPlan} 
                    onCloseClickedPoint={() => setClickedMapPoint(null)} 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DndContext>
    </div>
  );
}