import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Wallet, MapPin, Search, Plus, Clock, ListTodo, Map as MapIcon, Check, Trash2, Loader2, Edit3, Save, X, Plane, Hotel } from 'lucide-react';
import { TravelMap } from '../components/TravelMap';
import { OverviewView } from './OverviewView';
import { BudgetView, type BudgetItem } from './BudgetView';
import { FlightsAndHotelView } from './FlightsAndHotelView';

const MOCK_TRIP = {
  id: '1',
  title: 'Włoskie Wakacje',
  lat: 37.5999,
  lng: 14.0154,
  zoom: 8,
  startDate: '2026-05-25',
  endDate: '2026-05-29',
  budget: 4500,
  currency: 'PLN',
  days: [
    {
      id: 'd1',
      date: '2026-05-25',
      dayNumber: 1,
      customTitle: '',
      items: [
        { id: 'i1', title: 'Przylot i odbiór Fiata Pandy', time: '10:00', type: 'transport', lat: 37.4698, lng: 15.0659, cost: 800 },
      ]
    },
    {
      id: 'd2',
      date: '2026-05-26',
      dayNumber: 2,
      customTitle: '',
      items: [
        { id: 'i4', title: 'Zwiedzanie Taorminy (Teatr Antyczny)', time: '09:30', type: 'activity', lat: 37.8523, lng: 15.2922, cost: 120 },
      ]
    }
  ]
};

const DEFAULT_CENTER: [number, number] = [50.0614, 19.9365];
const zoomForKind = (kind: string | null) => (kind === 'country' ? 5 : kind === 'region' ? 8 : 11);
const biasDeltaForZoom = (zoom: number) => (zoom >= 10 ? 0.4 : zoom >= 7 ? 2 : 10);

export function Planer() {
  const { id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const isNew = id === 'nowy';
  const tripDestination = isNew ? (searchParams.get('dest') || 'Kraków, Polska') : 'Sycylia, Włochy';
  const tripTitle = isNew ? `Wyjazd: ${tripDestination.split(',')[0]}` : MOCK_TRIP.title;

  const destLat = isNew ? parseFloat(searchParams.get('lat') ?? '') : MOCK_TRIP.lat;
  const destLng = isNew ? parseFloat(searchParams.get('lng') ?? '') : MOCK_TRIP.lng;
  const destZoom = isNew ? zoomForKind(searchParams.get('kind')) : MOCK_TRIP.zoom;
  const hasDestCoords = !isNaN(destLat) && !isNaN(destLng);
  
  const [tripDays, setTripDays] = useState(() => {
    if (!isNew) return MOCK_TRIP.days;
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    if (!startParam || !endParam) return [];

    const startDate = new Date(startParam);
    const endDate = new Date(endParam);
    const daysCount = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return Array.from({ length: Math.max(1, daysCount) }).map((_, i) => {
      const date = new Date(startDate);
      date.setUTCDate(date.getUTCDate() + i);
      return { id: `d${i + 1}`, date: date.toISOString().split('T')[0], dayNumber: i + 1, customTitle: '', items: [] };
    });
  });

  const [activeSection, setActiveSection] = useState<string>('d1'); 
  const [mapCenter, setMapCenter] = useState<[number, number]>(hasDestCoords ? [destLat, destLng] : DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(4);
  
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placeRequestId = useRef(0);
  const searchBias = useRef<{ lat: number; lng: number; delta: number } | null>(null);

  const [clickedMapPoint, setClickedMapPoint] = useState<{ lat: number, lng: number, name: string, isLoading: boolean } | null>(null);

  // Stan budżetu i kosztów stałych podniesiony do poziomu planera
  const [totalBudget, setTotalBudget] = useState<number>(3000);
  const [customBudgetItems, setCustomBudgetItems] = useState<BudgetItem[]>([
    { id: 'flight-default', title: 'Loty w obie strony', category: 'Loty', cost: 1200, currency: 'PLN' },
    { id: 'hotel-default', title: 'Hotel / Nocleg', category: 'Hotel', cost: 1500, currency: 'PLN' },
  ]);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCost, setEditCost] = useState(0);

  const [isEditingDayTitle, setIsEditingDayTitle] = useState(false);
  const [dayCustomTitleInput, setDayCustomTitleInput] = useState('');

  const [newItemText, setNewItemText] = useState('');
  const [packingItems, setPackingItems] = useState([
    { id: 1, text: 'Paszport / Dowód osobisty', packed: false },
    { id: 2, text: 'Ładowarka do telefonu', packed: true },
  ]);

  const isScheduleMode = activeSection.startsWith('d');

  useEffect(() => {
    if (hasDestCoords) {
      setMapCenter([destLat, destLng]);
      setMapZoom(destZoom);
      searchBias.current = { lat: destLat, lng: destLng, delta: biasDeltaForZoom(destZoom) };
      return;
    }

    if (!tripDestination) return;
    let cancelled = false;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=pl&q=${encodeURIComponent(tripDestination)}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled || !data || data.length === 0) return;
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const zoom = data[0].addresstype === 'country' ? 5 : 11;
        setMapCenter([lat, lng]);
        setMapZoom(zoom);
        searchBias.current = { lat, lng, delta: biasDeltaForZoom(zoom) };
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
        let url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&accept-language=pl&q=${encodeURIComponent(query.trim())}`;
        const bias = searchBias.current;
        if (bias) {
          const left = bias.lng - bias.delta;
          const right = bias.lng + bias.delta;
          const top = bias.lat + bias.delta;
          const bottom = bias.lat - bias.delta;
          url += `&viewbox=${left},${top},${right},${bottom}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (requestId !== placeRequestId.current) return;
        setPlaceResults(data || []);
      } catch {
        if (requestId === placeRequestId.current) setPlaceResults([]);
      } finally {
        if (requestId === placeRequestId.current) setIsSearching(false);
      }
    }, 500);
  };

  const addItemToActiveDay = (placeName: string, lat: number, lng: number) => {
    if (!activeSection.startsWith('d')) return; 
    
    const newItem = {
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

  const handleAddPlaceFromSearch = (place: any) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    if (isNaN(lat) || isNaN(lng)) return;

    const placeName = place?.display_name ? place.display_name.split(',')[0] : 'Wybrane miejsce';
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
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=pl`);
      const data = await res.json();
      let placeName = 'Wybrane miejsce';
      if (data && data.display_name) {
        placeName = data.name || data.address?.road || data.display_name.split(',')[0];
      }
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

  const startEditingItem = (item: any) => {
    setEditingItemId(item.id);
    setEditTitle(item.title);
    setEditTime(item.time);
    setEditCost(item.cost || 0);
  };

  const saveEditingItem = (dayId: string, itemId: string) => {
    setTripDays(prevDays => prevDays.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          items: day.items.map(item => item.id === itemId ? { ...item, title: editTitle, time: editTime, cost: Number(editCost) } : item)
        };
      }
      return day;
    }));
    setEditingItemId(null);
  };

  const deleteScheduleItem = (dayId: string, itemId: string) => {
    setTripDays(prevDays => prevDays.map(day => {
      if (day.id === dayId) {
        return { ...day, items: day.items.filter(item => item.id !== itemId) };
      }
      return day;
    }));
  };

  const saveDayCustomTitle = (dayId: string) => {
    setTripDays(prevDays => prevDays.map(day => {
      if (day.id === dayId) {
        return { ...day, customTitle: dayCustomTitleInput.trim() };
      }
      return day;
    }));
    setIsEditingDayTitle(false);
  };

  const togglePackingItem = (id: number) => setPackingItems(items => items.map(item => item.id === id ? { ...item, packed: !item.packed } : item));
  const deletePackingItem = (id: number, e: React.MouseEvent) => { e.stopPropagation(); setPackingItems(items => items.filter(item => item.id !== id)); };
  const addPackingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setPackingItems([...packingItems, { id: Date.now(), text: newItemText, packed: false }]);
    setNewItemText('');
  };

  const currentDay = tripDays.find(d => d.id === activeSection);
  const mapPlaces = currentDay?.items.map(item => ({
    id: item.id,
    name: item.title,
    displayName: item.time,
    lat: item.lat,
    lng: item.lng
  })) || [];

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans text-slate-900">
      
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-black text-lg text-slate-900 leading-tight truncate max-w-md">{tripTitle}</h1>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-500" /> {tripDestination}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* SIDEBAR */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0 overflow-y-auto z-20">
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 px-3">Ogólne</h3>
              <div className="space-y-1">
                <button onClick={() => setActiveSection('overview')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${activeSection === 'overview' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                  <MapIcon className="w-4 h-4" /> Przegląd wyjazdu
                </button>
                <button onClick={() => setActiveSection('flights-hotel')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${activeSection === 'flights-hotel' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                  <Plane className="w-4 h-4" /> Loty i nocleg
                </button>
                <button onClick={() => setActiveSection('budget')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${activeSection === 'budget' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                  <Wallet className="w-4 h-4" /> Budżet
                </button>
                <button onClick={() => setActiveSection('packing')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${activeSection === 'packing' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                  <ListTodo className="w-4 h-4" /> Lista rzeczy
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 px-3">Harmonogram</h3>
              <div className="space-y-1">
                {tripDays.map((day) => {
                  const dayName = day.customTitle ? day.customTitle : `Dzień ${day.dayNumber}`;
                  return (
                    <button 
                      key={day.id}
                      onClick={() => { setActiveSection(day.id); setIsEditingDayTitle(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${activeSection === day.id ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
                    >
                      <span className="flex items-center gap-3 truncate pr-2">
                        <Calendar className="w-4 h-4 opacity-70 shrink-0" /> 
                        <span className="truncate">{dayName}</span>
                      </span>
                      <span className={`text-[10px] font-black shrink-0 ${activeSection === day.id ? 'text-slate-400' : 'text-slate-400'}`}>
                        {day.date.split('-').slice(1).join('.')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 bg-white flex flex-col h-full min-w-[400px] overflow-y-auto">
          
          {isScheduleMode && (
            <div className="p-4 border-b border-slate-100 bg-white shadow-sm z-20 shrink-0 relative">
              <div className="relative">
                {isSearching ? (
                  <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 animate-spin" />
                ) : (
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                )}
                <input 
                  type="text" 
                  value={placeQuery}
                  onChange={(e) => handleSearchPlace(e.target.value)}
                  placeholder="Szukaj miejsc lub dodawaj je klikając na mapie..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {placeResults.length > 0 && placeQuery.trim() !== '' && (
                <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[300px] overflow-y-auto z-30">
                  {placeResults.map((place, index) => (
                    <button
                      key={place?.place_id || index}
                      onClick={() => handleAddPlaceFromSearch(place)}
                      className="w-full text-left px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors mt-0.5 shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {place?.display_name ? place.display_name.split(',')[0] : 'Miejsce'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {place?.display_name || ''}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 p-6 bg-slate-50/50">
            {activeSection === 'overview' ? (
              <OverviewView 
                tripTitle={tripTitle} 
                destination={tripDestination} 
                startDate={searchParams.get('start') || '2026-05-25'} 
                endDate={searchParams.get('end') || '2026-05-29'} 
                totalDays={tripDays.length}
                totalBudget={totalBudget}
                customItems={customBudgetItems}
                scheduleItems={tripDays.flatMap(day => day.items)}
                packingItemsCount={packingItems.length}
                packedItemsCount={packingItems.filter(i => i.packed).length}
              />
            ) : activeSection === 'flights-hotel' ? (
              <FlightsAndHotelView 
                customItems={customBudgetItems}
                setCustomItems={setCustomBudgetItems}
              />
            ) : activeSection === 'budget' ? (
              <BudgetView 
                budget={totalBudget}
                setBudget={setTotalBudget}
                customItems={customBudgetItems}
                setCustomItems={setCustomBudgetItems}
                scheduleItems={tripDays.flatMap(day => day.items)} 
              />
            ) : activeSection === 'packing' ? (
              <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <ListTodo className="w-6 h-6 text-emerald-500" /> Co spakować?
                  </h2>
                  <p className="text-slate-500 font-medium text-sm mt-2">Zaznaczaj rzeczy, które już wrzuciłeś do walizki.</p>
                </div>
                <div className="space-y-3 mb-6">
                  {packingItems.map(item => (
                    <div key={item.id} onClick={() => togglePackingItem(item.id)} className={`flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${item.packed ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'}`}>
                      <div className="flex items-center gap-4">
                        <button className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors ${item.packed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                          {item.packed && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                        <span className={`font-bold text-sm ${item.packed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.text}</span>
                      </div>
                      <button onClick={(e) => deletePackingItem(item.id, e)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Usuń pozycję"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <form onSubmit={addPackingItem} className="relative">
                  <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="Dodaj kolejną rzecz..." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                </form>
              </div>
            ) : activeSection.startsWith('d') && currentDay ? (
              <div className="max-w-3xl mx-auto">
                
                {/* NAGŁÓWEK DNIA Z OPCJĄ EDYCJI NAZWY */}
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    {isEditingDayTitle ? (
                      <div className="flex items-center gap-2 mb-1">
                        <input 
                          type="text" 
                          value={dayCustomTitleInput}
                          onChange={(e) => setDayCustomTitleInput(e.target.value)}
                          placeholder={`np. Dzień ${currentDay.dayNumber}: Przylot`}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          autoFocus
                        />
                        <button 
                          onClick={() => saveDayCustomTitle(currentDay.id)}
                          className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors cursor-pointer shadow-sm"
                          title="Zapisz nazwę"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setIsEditingDayTitle(false)}
                          className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 group/title">
                        <h2 className="text-2xl font-black text-slate-900">
                          {currentDay.customTitle ? currentDay.customTitle : `Dzień ${currentDay.dayNumber}`}
                        </h2>
                        <button 
                          onClick={() => {
                            setDayCustomTitleInput(currentDay.customTitle || `Dzień ${currentDay.dayNumber}`);
                            setIsEditingDayTitle(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover/title:opacity-100 cursor-pointer"
                          title="Zmień nazwę dnia"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-slate-500 font-medium text-sm mt-0.5">{currentDay.date}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {currentDay.items.length > 0 ? currentDay.items.map((item, index) => (
                    <div key={item.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all group relative">
                      {index !== currentDay.items.length - 1 && (
                        <div className="absolute left-6 top-14 bottom-[-16px] w-0.5 bg-slate-200 z-0"></div>
                      )}
                      
                      {editingItemId === item.id ? (
                        <div className="space-y-3 relative z-10">
                          <div className="flex gap-3">
                            <input 
                              type="time" 
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <input 
                              type="text" 
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Nazwa miejsca"
                              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500">Koszt (PLN):</span>
                              <input 
                                type="number" 
                                value={editCost}
                                onChange={(e) => setEditCost(Number(e.target.value))}
                                className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => saveEditingItem(currentDay.id, item.id)}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <Save className="w-3.5 h-3.5" /> Zapisz
                              </button>
                              <button 
                                onClick={() => setEditingItemId(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4 relative z-10">
                          <div className="w-14 text-right shrink-0 pt-0.5">
                            <span className="text-sm font-black text-slate-800">{item.time}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h3 className="font-bold text-slate-900 leading-tight pr-4">{item.title}</h3>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => startEditingItem(item)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                                  title="Edytuj kafelek"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => deleteScheduleItem(currentDay.id, item.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                  title="Usuń z planu"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-3 text-xs font-bold text-slate-500">
                              {item.cost > 0 && (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md">
                                  <Wallet className="w-3 h-3 text-slate-400" /> {item.cost} PLN
                                </span>
                              )}
                              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md">
                                <Clock className="w-3 h-3 text-slate-400" /> 2h
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-8 text-center">
                      <div className="inline-flex bg-slate-50 p-3 rounded-full mb-3">
                        <MapPin className="w-6 h-6 text-slate-400" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">Twój dzień jest pusty</h3>
                      <p className="text-sm text-slate-500">Użyj wyszukiwarki lub kliknij w dowolne miejsce na mapie.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* MAPA WIDOCZNA W TRYBIE HARMONOGRAMU */}
        {isScheduleMode && (
          <div className="w-[35%] min-w-[350px] border-l border-slate-200 relative bg-slate-200 shrink-0 z-10">
            <TravelMap 
              places={mapPlaces}
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
        )}

      </div>
    </div>
  );
}