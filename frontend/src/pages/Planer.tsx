import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, MapPin, Search, Plus, Clock, ListTodo, Map as MapIcon, Check, Trash2, Loader2, Edit3, Save, X, Plane, LogOut, ChevronRight, ChevronLeft, GripVertical, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// DND-KIT IMPORTS
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
      color: '#10b981',
      items: [
        { id: 'i1', title: 'Przylot i odbiór Fiata Pandy', time: '10:00', type: 'transport', lat: 37.4698, lng: 15.0659, cost: 800 },
      ]
    },
    {
      id: 'd2',
      date: '2026-05-26',
      dayNumber: 2,
      customTitle: '',
      color: '#2563eb',
      items: [
        { id: 'i4', title: 'Zwiedzanie Taorminy (Teatr Antyczny)', time: '09:30', type: 'activity', lat: 37.8523, lng: 15.2922, cost: 120 },
      ]
    }
  ]
};

const DEFAULT_CENTER: [number, number] = [50.0614, 19.9365];
const zoomForKind = (kind: string | null) => (kind === 'country' ? 5 : kind === 'region' ? 8 : 11);
const biasDeltaForZoom = (zoom: number) => (zoom >= 10 ? 0.4 : zoom >= 7 ? 2 : 10);

function SortableScheduleItem(props: any) {
  const { item, isLast, editingItemId, editTitle, editTime, editCost, setEditTitle, setEditTime, setEditCost, startEditingItem, saveEditingItem, deleteScheduleItem, setEditingItemId, dayId, onFocusOnMap } = props;
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1 };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      onClick={() => {
        if (editingItemId !== item.id) {
          onFocusOnMap(item.lat, item.lng);
        }
      }}
      className={`bg-white border p-4 rounded-2xl transition-all group relative flex items-start gap-1 z-10 cursor-pointer select-none ${isDragging ? 'shadow-2xl scale-[1.02] border-emerald-400 opacity-95' : 'border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300'}`}
    >
      
      {!isLast && <div className="absolute left-[34px] top-14 bottom-[-16px] w-0.5 bg-slate-200 z-0"></div>}
      
      {/* Uchwyt do przeciągania */}
      <div {...attributes} {...listeners} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-emerald-500 rounded-lg outline-none z-10 shrink-0 mt-0.5" title="Przeciągnij">
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1 w-full relative z-10">
        {editingItemId === item.id ? (
          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-3">
              <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Nazwa miejsca" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Koszt (PLN):</span>
                <input type="number" value={editCost} onChange={(e) => setEditCost(Number(e.target.value))} className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => saveEditingItem(dayId, item.id)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"><Save className="w-3.5 h-3.5" /> Zapisz</button>
                <button onClick={() => setEditingItemId(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="w-14 text-right shrink-0 pt-0.5">
              <span className="text-sm font-black text-slate-800">{item.time}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-slate-900 leading-tight pr-4">{item.title}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); startEditingItem(item); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer" title="Edytuj"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteScheduleItem(dayId, item.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Usuń"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs font-bold text-slate-500">
                {item.cost > 0 && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md"><Wallet className="w-3 h-3 text-slate-400" /> {item.cost} PLN</span>}
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md"><Clock className="w-3 h-3 text-slate-400" /> 2h</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- KOMPONENT SORTOWALNEGO DNIA W PANELU BOCZNYM ---
function SortableDayItem(props: any) {
  const { day, activeSection, setActiveSection, setIsEditingDayTitle, onFocusOnMap } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1 };

  const dayName = day.customTitle ? day.customTitle : `Dzień ${day.dayNumber}`;
  const isActive = activeSection === day.id;

  const isHex = day.color && day.color.startsWith('#');
  const dotStyle = isHex ? { backgroundColor: isActive ? '#ffffff' : day.color } : {};
  const dotClassName = isHex 
    ? "w-3 h-3 rounded-full shrink-0" 
    : `w-3 h-3 rounded-full ${isActive ? 'bg-white' : (day.color || 'bg-emerald-500')} shrink-0`;
  
  const subDotStyle = isHex ? { backgroundColor: day.color } : {};
  const subDotClassName = isHex ? "w-1.5 h-1.5 rounded-full shrink-0" : `w-1.5 h-1.5 rounded-full ${day.color || 'bg-emerald-500'} shrink-0`;

  const activeBgStyle = isActive ? (isHex ? { backgroundColor: day.color } : {}) : {};
  const activeBgClass = isActive 
    ? (isHex ? 'text-white shadow-sm' : `${day.color} text-white shadow-sm`)
    : 'text-slate-600 hover:bg-slate-200/50';

  return (
    <div ref={setNodeRef} style={style} className={`rounded-xl transition-colors ${isDragging ? 'opacity-50 bg-slate-200' : ''}`}>
      <div 
        style={activeBgStyle} 
        onClick={() => { setActiveSection(day.id); setIsEditingDayTitle(false); }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer select-none ${activeBgClass}`}
      >
        <div className="flex items-center gap-3 truncate pr-2 flex-1 text-left">
          <span style={dotStyle} className={dotClassName}></span>
          <span className="truncate">{dayName}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-black ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
            {day.date.split('-').slice(1).join('.')}
          </span>
          <div {...attributes} {...listeners} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-emerald-500 rounded outline-none" title="Przesuń dzień">
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* PODKATEGORIE: Atrakcje w lewym panelu */}
      {day.items.length > 0 && (
        <div className="pl-7 pr-2 py-1 space-y-1">
          {day.items.map((item: any) => (
            <button
              key={item.id}
              onClick={() => { 
                setActiveSection(day.id); 
                onFocusOnMap(item.lat, item.lng);
              }}
              className="w-full text-left text-xs font-medium text-slate-500 hover:text-slate-900 truncate py-1 px-2 rounded hover:bg-slate-200/60 transition-colors flex items-center gap-2 cursor-pointer select-none"
            >
              <span style={subDotStyle} className={subDotClassName}></span>
              <span className="truncate">{item.time} - {item.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- GŁÓWNY KOMPONENT ---
export function Planer() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  const isNew = id === 'nowy';
  const tripDestination = isNew ? (searchParams.get('dest') || 'Kraków, Polska') : 'Sycylia, Włochy';
  const tripTitle = isNew ? `Wyjazd: ${tripDestination.split(',')[0]}` : MOCK_TRIP.title;

  const destLat = isNew ? parseFloat(searchParams.get('lat') ?? '') : MOCK_TRIP.lat;
  const destLng = isNew ? parseFloat(searchParams.get('lng') ?? '') : MOCK_TRIP.lng;
  const destZoom = isNew ? zoomForKind(searchParams.get('kind')) : MOCK_TRIP.zoom;
  const hasDestCoords = !isNaN(destLat) && !isNaN(destLng);
  
  const [tripDays, setTripDays] = useState(() => {
    const defaultColors = ['#10b981', '#2563eb', '#f59e0b', '#9333ea', '#f43f5e', '#ea580c'];
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
      return { 
        id: `d${i + 1}`, 
        date: date.toISOString().split('T')[0], 
        dayNumber: i + 1, 
        customTitle: '', 
        color: defaultColors[i % defaultColors.length],
        items: [] 
      };
    });
  });

  const [activeSection, setActiveSection] = useState<string>('d1'); 
  const [mapCenter, setMapCenter] = useState<[number, number]>(hasDestCoords ? [destLat, destLng] : DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(4);
  const [isMapVisible, setIsMapVisible] = useState(true);
  
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placeRequestId = useRef(0);
  const searchBias = useRef<{ lat: number; lng: number; delta: number } | null>(null);

  const [clickedMapPoint, setClickedMapPoint] = useState<{ lat: number, lng: number, name: string, isLoading: boolean } | null>(null);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith('d') && overId.startsWith('d')) {
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

  const changeDayColor = (dayId: string, color: string) => {
    setTripDays(prevDays => prevDays.map(day => {
      if (day.id === dayId) {
        return { ...day, color };
      }
      return day;
    }));
  };

  const togglePackingItem = (id: number) => setPackingItems(items => items.map(item => item.id === id ? { ...item, packed: !item.packed } : item));
  const deletePackingItem = (id: number, e: React.MouseEvent) => { e.stopPropagation(); setPackingItems(items => items.filter(item => item.id !== id)); };
  const addPackingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setPackingItems([...packingItems, { id: Date.now(), text: newItemText, packed: false }]);
    setNewItemText('');
  };

  // ZBIERAMY WSZYSTKIE PINEZKI ZE WSZYSTKICH DNI DO WYŚWIETLENIA NA MAPIE
  const allMapPlaces = tripDays.flatMap(day => 
    day.items.map(item => ({
      id: item.id,
      name: item.title,
      displayName: `${item.time} - ${item.title} (${day.customTitle || `Dzień ${day.dayNumber}`})`,
      lat: item.lat,
      lng: item.lng,
      color: day.color || '#10b981'
    }))
  );

  const currentDay = tripDays.find(d => d.id === activeSection);

  // Funkcja centrowania mapy na wybranej atrakcji po kliknięciu
  const handleFocusOnMap = (lat: number, lng: number) => {
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
      setMapZoom(15); // Dokładne przybliżenie na atrakcję
    }
  };

  // Style inline dla nagłówka dnia, jeśli kolor jest w formacie HEX
  const isCurrentDayHex = currentDay?.color && currentDay.color.startsWith('#');
  const currentDayDotStyle = isCurrentDayHex ? { backgroundColor: currentDay.color } : {};
  const currentDayDotClass = isCurrentDayHex ? "w-4 h-4 rounded-full shrink-0" : `w-4 h-4 rounded-full ${currentDay?.color || 'bg-emerald-500'} shrink-0`;

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
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 mr-4 border-r border-slate-200 pr-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">E</div>
            <span className="text-sm font-medium text-slate-700">Cześć, Emil</span>
          </div>
          <button onClick={() => navigate('/')} className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors flex items-center gap-2 cursor-pointer">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Wyloguj</span>
          </button>
        </div>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* SIDEBAR */}
          <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0 overflow-y-auto z-20">
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 px-3">Ogólne</h3>
                <div className="space-y-1">
                  <button onClick={() => setActiveSection('overview')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer select-none ${activeSection === 'overview' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                    <MapIcon className="w-4 h-4" /> Przegląd wyjazdu
                  </button>
                  <button onClick={() => setActiveSection('flights-hotel')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer select-none ${activeSection === 'flights-hotel' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                    <Plane className="w-4 h-4" /> Loty i nocleg
                  </button>
                  <button onClick={() => setActiveSection('budget')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer select-none ${activeSection === 'budget' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                    <Wallet className="w-4 h-4" /> Budżet
                  </button>
                  <button onClick={() => setActiveSection('packing')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer select-none ${activeSection === 'packing' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                    <ListTodo className="w-4 h-4" /> Lista rzeczy
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 px-3">Harmonogram</h3>
                <SortableContext items={tripDays.map(d => d.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {tripDays.map((day) => (
                      <SortableDayItem 
                        key={day.id}
                        day={day}
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                        setIsEditingDayTitle={setIsEditingDayTitle}
                        onFocusOnMap={handleFocusOnMap}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white flex flex-col h-full min-w-[400px] relative z-20 shadow-[10px_0_15px_-3px_rgba(0,0,0,0.05)] overflow-x-hidden">
            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
              {isScheduleMode && (
                <div className="p-4 border-b border-slate-100 bg-white shadow-sm shrink-0 relative">
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
                      <FlightsAndHotelView customItems={customBudgetItems} setCustomItems={setCustomBudgetItems} />
                    ) : activeSection === 'budget' ? (
                      <BudgetView budget={totalBudget} setBudget={setTotalBudget} customItems={customBudgetItems} setCustomItems={setCustomBudgetItems} scheduleItems={tripDays.flatMap(day => day.items)} />
                    ) : activeSection === 'packing' ? (
                      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                        <div className="mb-8">
                          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3"><ListTodo className="w-6 h-6 text-emerald-500" /> Co spakować?</h2>
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
                        
                        <div className="mb-6 flex items-start justify-between">
                          <div>
                            {isEditingDayTitle ? (
                              <div className="flex items-center gap-2 mb-1">
                                <input type="text" value={dayCustomTitleInput} onChange={(e) => setDayCustomTitleInput(e.target.value)} placeholder={`np. Dzień ${currentDay.dayNumber}: Przylot`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" autoFocus />
                                <button onClick={() => saveDayCustomTitle(currentDay.id)} className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-sm"><Save className="w-4 h-4" /></button>
                                <button onClick={() => setIsEditingDayTitle(false)} className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-colors"><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 group/title">
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                  <span style={currentDayDotStyle} className={currentDayDotClass}></span>
                                  {currentDay.customTitle ? currentDay.customTitle : `Dzień ${currentDay.dayNumber}`}
                                </h2>
                                <button onClick={() => { setDayCustomTitleInput(currentDay.customTitle || `Dzień ${currentDay.dayNumber}`); setIsEditingDayTitle(true); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover/title:opacity-100"><Edit3 className="w-4 h-4" /></button>
                              </div>
                            )}
                            <p className="text-slate-500 font-medium text-sm mt-0.5">{currentDay.date}</p>
                          </div>

                          {/* WYBÓR KOLORU PINEZKI */}
                          <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-3.5 py-2 rounded-2xl shadow-sm">
                            <Palette className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-600">Kolor pinezki:</span>
                            <input 
                              type="color" 
                              value={isCurrentDayHex ? currentDay.color : '#10b981'}
                              onChange={(e) => changeDayColor(currentDay.id, e.target.value)}
                              className="w-7 h-7 rounded-xl border-0 cursor-pointer bg-transparent shadow-sm"
                              title="Wybierz kolor pinezki dla tego dnia"
                            />
                          </div>
                        </div>

                        {/* LISTA KAFELKÓW W AKTUALNYM DNIU */}
                        <SortableContext items={currentDay.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-4">
                            {currentDay.items.length > 0 ? currentDay.items.map((item, index) => (
                              <SortableScheduleItem 
                                key={item.id}
                                item={item}
                                index={index}
                                isLast={index === currentDay.items.length - 1}
                                editingItemId={editingItemId}
                                editTitle={editTitle}
                                editTime={editTime}
                                editCost={editCost}
                                setEditTitle={setEditTitle}
                                setEditTime={setEditTime}
                                setEditCost={setEditCost}
                                startEditingItem={startEditingItem}
                                saveEditingItem={saveEditingItem}
                                deleteScheduleItem={deleteScheduleItem}
                                setEditingItemId={setEditingItemId}
                                dayId={currentDay.id}
                                onFocusOnMap={handleFocusOnMap}
                              />
                            )) : (
                              <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-8 text-center">
                                <div className="inline-flex bg-slate-50 p-3 rounded-full mb-3"><MapPin className="w-6 h-6 text-slate-400" /></div>
                                <h3 className="font-bold text-slate-900 mb-1">Twój dzień jest pusty</h3>
                                <p className="text-sm text-slate-500">Użyj wyszukiwarki lub kliknij w dowolne miejsce na mapie.</p>
                              </div>
                            )}
                          </div>
                        </SortableContext>
                      </div>
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {isScheduleMode && (
              <button onClick={() => setIsMapVisible(!isMapVisible)} className="absolute right-[-14px] top-1/2 -translate-y-1/2 z-[60] bg-white border border-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.1)] p-1.5 rounded-full text-slate-400 hover:text-emerald-500 hover:scale-110 transition-all" title={isMapVisible ? "Ukryj mapę" : "Pokaż mapę"}>
                {isMapVisible ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            )}
          </div>

          <AnimatePresence initial={false}>
            {isScheduleMode && isMapVisible && (
              <motion.div initial={{ width: 0, minWidth: 0, opacity: 0 }} animate={{ width: '35%', minWidth: '350px', opacity: 1 }} exit={{ width: 0, minWidth: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="border-l border-slate-200 relative bg-slate-200 shrink-0 z-10 overflow-hidden h-full flex flex-col">
                <div className="w-full h-full min-w-[350px]">
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