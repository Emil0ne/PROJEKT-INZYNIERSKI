import { useState } from 'react';
import { Wallet, MapPin, Clock, Trash2, Edit3, Save, X, GripVertical, Palette, ArrowRightLeft, Route } from 'lucide-react';
import { formatKm, routeLengthKm } from '../../lib/geo';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, EmptyState, IconButton } from '../ui';
import { DEFAULT_DAY_CLASS } from '../../lib/constants';
import type { ScheduleItem, TripDay } from '../../types/trip';

interface SortableScheduleItemProps {
  item: ScheduleItem;
  index: number;
  color?: string;
  isLast: boolean;
  editingItemId: string | null;
  editTitle: string;
  editTime: string;
  editCost: number;
  setEditTitle: (value: string) => void;
  setEditTime: (value: string) => void;
  setEditCost: (value: number) => void;
  startEditingItem: (item: ScheduleItem) => void;
  saveEditingItem: (dayId: string, itemId: string) => void;
  deleteScheduleItem: (dayId: string, itemId: string) => void;
  setEditingItemId: (id: string | null) => void;
  dayId: string;
  onFocusOnMap: (lat: number, lng: number) => void;
  currency: string;
  otherDays: DayOption[];
  onMoveItem: (fromDayId: string, itemId: string, toDayId: string) => void;
}

export interface DayOption {
  id: string;
  label: string;
}

function SortableScheduleItem(props: SortableScheduleItemProps) {
  const { currency, item, index, color, isLast, editingItemId, editTitle, editTime, editCost, setEditTitle, setEditTime, setEditCost, startEditingItem, saveEditingItem, deleteScheduleItem, setEditingItemId, dayId, onFocusOnMap, otherDays, onMoveItem } = props;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, data: { type: 'item', dayId } });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1 };

  const isHex = !!color && color.startsWith('#');
  const markerStyle = isHex ? { backgroundColor: color } : {};
  const markerClass = isHex ? '' : (color || DEFAULT_DAY_CLASS);
  const isEditing = editingItemId === item.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => {
        if (!isEditing) {
          onFocusOnMap(item.lat, item.lng);
        }
      }}
      className={`group relative flex items-start gap-3 px-2 py-3 rounded-lg transition-colors cursor-pointer select-none ${isDragging ? 'bg-white shadow-md border border-stone-300 opacity-95' : 'hover:bg-white border border-transparent hover:border-stone-200'}`}
    >
      {/* Oś czasu: numerowany znacznik + pionowa linia do kolejnego punktu */}
      <div className="relative w-6 shrink-0 flex justify-center">
        {!isLast && <span className="absolute left-1/2 -translate-x-1/2 top-6 -bottom-[1.6rem] w-px bg-stone-300" />}
        <span style={markerStyle} className={`relative z-10 w-6 h-6 rounded-full text-white text-xs font-semibold flex items-center justify-center ring-2 ring-[#FAF9F6] ${markerClass}`}>
          {index + 1}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-2.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2">
              <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-zinc-900/10 focus:border-zinc-900" />
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Nazwa miejsca" className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-zinc-900/10 focus:border-zinc-900" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Koszt ({currency})</span>
                <input type="number" value={editCost} onChange={(e) => setEditCost(Number(e.target.value))} className="w-24 px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-zinc-900/10 focus:border-zinc-900" />
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" onClick={() => saveEditingItem(dayId, item.id)}><Save className="w-3.5 h-3.5" /> Zapisz</Button>
                <IconButton label="Anuluj edycję" onClick={() => setEditingItemId(null)}><X className="w-4 h-4" /></IconButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-zinc-900 text-sm leading-snug">{item.title}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-stone-500 tabular-nums">
                <span className="font-medium text-stone-700">{item.time}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 2h</span>
                {item.cost > 0 && <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> {item.cost} {currency}</span>}
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              {otherDays.length > 0 && (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <span className="flex p-1.5 text-stone-500 hover:text-zinc-900 rounded-lg pointer-events-none" aria-hidden="true">
                    <ArrowRightLeft className="w-4 h-4" />
                  </span>
                  {/* Natywny select nałożony na ikonę – szybkie przeniesienie do innego dnia */}
                  <select
                    aria-label="Przenieś do innego dnia"
                    title="Przenieś do innego dnia"
                    value=""
                    onChange={(e) => { if (e.target.value) onMoveItem(dayId, item.id, e.target.value); }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    <option value="" disabled>Przenieś do…</option>
                    {otherDays.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                </div>
              )}
              <IconButton label="Edytuj" onClick={(e) => { e.stopPropagation(); startEditingItem(item); }}><Edit3 className="w-4 h-4" /></IconButton>
              <IconButton label="Usuń" variant="danger" onClick={(e) => { e.stopPropagation(); deleteScheduleItem(dayId, item.id); }}><Trash2 className="w-4 h-4" /></IconButton>
              {/* Uchwyt do przeciągania */}
              <div {...attributes} {...listeners} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing p-1.5 text-stone-400 hover:text-zinc-900 rounded-lg outline-none" title="Przeciągnij" aria-label="Przeciągnij pozycję">
                <GripVertical className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export interface ScheduleItemChanges {
  title: string;
  time: string;
  cost: number;
}

interface DayScheduleViewProps {
  day: TripDay;
  currency: string;
  otherDays: DayOption[];
  onMoveItem: (fromDayId: string, itemId: string, toDayId: string) => void;
  onFocusOnMap: (lat: number, lng: number) => void;
  onUpdateItem: (dayId: string, itemId: string, changes: ScheduleItemChanges) => void;
  onDeleteItem: (dayId: string, itemId: string) => void;
  onRenameDay: (dayId: string, title: string) => void;
  onChangeColor: (dayId: string, color: string) => void;
}

/** Widok wybranego dnia: nagłówek (nazwa, kolor pinezek) + oś czasu z edytowalnymi, sortowalnymi punktami. */
export function DayScheduleView({ day, currency, otherDays, onMoveItem, onFocusOnMap, onUpdateItem, onDeleteItem, onRenameDay, onChangeColor }: DayScheduleViewProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCost, setEditCost] = useState(0);

  const [isEditingDayTitle, setIsEditingDayTitle] = useState(false);
  const [dayCustomTitleInput, setDayCustomTitleInput] = useState('');

  const startEditingItem = (item: ScheduleItem) => {
    setEditingItemId(item.id);
    setEditTitle(item.title);
    setEditTime(item.time);
    setEditCost(item.cost || 0);
  };

  const saveEditingItem = (dayId: string, itemId: string) => {
    onUpdateItem(dayId, itemId, { title: editTitle, time: editTime, cost: Number(editCost) });
    setEditingItemId(null);
  };

  const saveDayCustomTitle = () => {
    onRenameDay(day.id, dayCustomTitleInput.trim());
    setIsEditingDayTitle(false);
  };

  // Style inline dla nagłówka dnia, jeśli kolor jest w formacie HEX
  const isDayColorHex = !!day.color && day.color.startsWith('#');
  const dayDotStyle = isDayColorHex ? { backgroundColor: day.color } : {};
  const dayDotClass = isDayColorHex ? 'w-4 h-4 rounded-full shrink-0' : `w-4 h-4 rounded-full ${day.color || DEFAULT_DAY_CLASS} shrink-0`;

  return (
      <div className="max-w-2xl mx-auto">
    
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            {isEditingDayTitle ? (
              <div className="flex items-center gap-2 mb-1">
                <input type="text" value={dayCustomTitleInput} onChange={(e) => setDayCustomTitleInput(e.target.value)} placeholder={`np. Dzień ${day.dayNumber}: Przylot`} className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-lg font-semibold tracking-tight text-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 focus:border-zinc-900" autoFocus />
                <Button aria-label="Zapisz nazwę dnia" title="Zapisz nazwę dnia" onClick={() => saveDayCustomTitle()} className="!p-2"><Save className="w-4 h-4" /></Button>
                <Button variant="secondary" aria-label="Anuluj edycję nazwy dnia" title="Anuluj" onClick={() => setIsEditingDayTitle(false)} className="!p-2"><X className="w-4 h-4" /></Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group/title">
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900 flex items-center gap-2.5">
                  <span style={dayDotStyle} className={dayDotClass}></span>
                  {day.customTitle ? day.customTitle : `Dzień ${day.dayNumber}`}
                </h2>
                <IconButton label="Edytuj nazwę dnia" onClick={() => { setDayCustomTitleInput(day.customTitle || `Dzień ${day.dayNumber}`); setIsEditingDayTitle(true); }} className="opacity-0 group-hover/title:opacity-100 focus-visible:opacity-100"><Edit3 className="w-4 h-4" /></IconButton>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
              <p className="text-stone-500 text-sm tabular-nums">{day.date}</p>
              {day.items.length > 1 && (
                <span
                  title="Łączna długość trasy w linii prostej między kolejnymi punktami"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-stone-200 text-xs font-medium text-stone-600 tabular-nums"
                >
                  <Route className="w-3 h-3 text-stone-400" />
                  Trasa: {formatKm(routeLengthKm(day.items))}
                </span>
              )}
            </div>
          </div>
    
          {/* WYBÓR KOLORU PINEZKI */}
          <div className="flex items-center gap-2 bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow-xs shrink-0">
            <Palette className="w-4 h-4 text-stone-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Kolor</span>
            <input 
              type="color" 
              value={isDayColorHex ? day.color : '#10b981'}
              onChange={(e) => onChangeColor(day.id, e.target.value)}
              className="w-6 h-6 rounded-md border-0 cursor-pointer bg-transparent"
              title="Wybierz kolor pinezki dla tego dnia"
            />
          </div>
        </div>
    
        {/* LISTA KAFELKÓW W AKTUALNYM DNIU */}
        <SortableContext items={day.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-0">
            {day.items.length > 0 ? day.items.map((item, index) => (
              <SortableScheduleItem 
                key={item.id}
                item={item}
                index={index}
                color={day.color}
                isLast={index === day.items.length - 1}
                editingItemId={editingItemId}
                editTitle={editTitle}
                editTime={editTime}
                editCost={editCost}
                setEditTitle={setEditTitle}
                setEditTime={setEditTime}
                setEditCost={setEditCost}
                startEditingItem={startEditingItem}
                saveEditingItem={saveEditingItem}
                deleteScheduleItem={onDeleteItem}
                setEditingItemId={setEditingItemId}
                dayId={day.id}
                onFocusOnMap={onFocusOnMap}
                currency={currency}
                otherDays={otherDays}
                onMoveItem={onMoveItem}
              />
            )) : (
              <EmptyState
                icon={<MapPin />}
                title="Twój dzień jest pusty"
                description="Użyj wyszukiwarki lub kliknij w dowolne miejsce na mapie."
              />
            )}
          </div>
        </SortableContext>
      </div>
  );
}
