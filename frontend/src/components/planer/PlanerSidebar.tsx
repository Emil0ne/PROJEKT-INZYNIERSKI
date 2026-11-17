import { Wallet, Plane, ListTodo, Map as MapIcon, GripVertical } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DEFAULT_DAY_CLASS } from '../../lib/constants';
import type { TripDay } from '../../types/trip';

// --- KOMPONENT SORTOWALNEGO DNIA W PANELU BOCZNYM ---
interface SortableDayItemProps {
  day: TripDay;
  activeSection: string;
  setActiveSection: (id: string) => void;
  onFocusOnMap: (lat: number, lng: number) => void;
  isDropTarget: boolean;
  isDraggingItem: boolean;
}

function SortableDayItem(props: SortableDayItemProps) {
  const { day, activeSection, setActiveSection, onFocusOnMap, isDropTarget, isDraggingItem } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id, data: { type: 'day' } });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1 };

  const dayName = day.customTitle ? day.customTitle : `Dzień ${day.dayNumber}`;
  const isActive = activeSection === day.id;

  const isHex = day.color && day.color.startsWith('#');
  const dotStyle = isHex ? { backgroundColor: day.color } : {};
  const dotClassName = isHex
    ? 'w-2.5 h-2.5 rounded-full shrink-0'
    : `w-2.5 h-2.5 rounded-full ${day.color || DEFAULT_DAY_CLASS} shrink-0`;

  const subDotStyle = isHex ? { backgroundColor: day.color } : {};
  const subDotClassName = isHex ? 'w-1.5 h-1.5 rounded-full shrink-0' : `w-1.5 h-1.5 rounded-full ${day.color || DEFAULT_DAY_CLASS} shrink-0`;

  const activeClass = isActive
    ? 'bg-white border-stone-200 shadow-xs text-zinc-900'
    : 'border-transparent text-stone-600 hover:bg-stone-200/50';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg transition-colors ${isDragging ? 'opacity-50 bg-stone-200' : ''} ${isDropTarget ? 'ring-2 ring-emerald-500/70 bg-emerald-50' : isDraggingItem ? 'ring-1 ring-stone-300/70' : ''}`}
    >
      <div
        onClick={() => setActiveSection(day.id)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer select-none ${activeClass}`}
      >
        <div className="flex items-center gap-2.5 truncate pr-2 flex-1 text-left">
          <span style={dotStyle} className={dotClassName}></span>
          <span className="truncate">{dayName}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-medium tabular-nums text-stone-400">
            {day.date.split('-').slice(1).join('.')}
          </span>
          <div {...attributes} {...listeners} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing p-0.5 text-stone-300 hover:text-zinc-700 rounded outline-none" title="Przesuń dzień" aria-label={`Przesuń dzień: ${dayName}`}>
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* PODKATEGORIE: Atrakcje w lewym panelu */}
      {day.items.length > 0 && (
        <div className="pl-6 pr-2 py-1 space-y-0.5">
          {day.items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(day.id);
                onFocusOnMap(item.lat, item.lng);
              }}
              className="w-full text-left text-xs text-stone-500 hover:text-zinc-900 truncate py-1 px-2 rounded hover:bg-stone-200/60 transition-colors flex items-center gap-2 cursor-pointer select-none"
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

interface PlanerSidebarProps {
  tripDays: TripDay[];
  activeSection: string;
  setActiveSection: (id: string) => void;
  onFocusOnMap: (lat: number, lng: number) => void;
  /** Dzień podświetlany jako cel upuszczenia przeciąganej atrakcji. */
  dropTargetDayId: string | null;
  isDraggingItem: boolean;
}

/** Lewy panel planera: zakładki ogólne (przegląd, loty, budżet, pakowanie) + sortowalna lista dni. */
export function PlanerSidebar({ tripDays, activeSection, setActiveSection, onFocusOnMap, dropTargetDayId, isDraggingItem }: PlanerSidebarProps) {
  return (
    <div className="w-60 bg-stone-100/60 border-r border-stone-200 flex flex-col h-full shrink-0 overflow-y-auto z-20">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-xs font-semibold tracking-wider text-stone-500 uppercase mb-2 px-3">Ogólne</h3>
          <div className="space-y-1">
            <button onClick={() => setActiveSection('overview')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none ${activeSection === 'overview' ? 'bg-white border border-stone-200 shadow-xs text-zinc-900' : 'border border-transparent text-stone-600 hover:bg-stone-200/50'}`}>
              <MapIcon className="w-4 h-4" /> Przegląd wyjazdu
            </button>
            <button onClick={() => setActiveSection('flights-hotel')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none ${activeSection === 'flights-hotel' ? 'bg-white border border-stone-200 shadow-xs text-zinc-900' : 'border border-transparent text-stone-600 hover:bg-stone-200/50'}`}>
              <Plane className="w-4 h-4" /> Loty i nocleg
            </button>
            <button onClick={() => setActiveSection('budget')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none ${activeSection === 'budget' ? 'bg-white border border-stone-200 shadow-xs text-zinc-900' : 'border border-transparent text-stone-600 hover:bg-stone-200/50'}`}>
              <Wallet className="w-4 h-4" /> Budżet
            </button>
            <button onClick={() => setActiveSection('packing')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none ${activeSection === 'packing' ? 'bg-white border border-stone-200 shadow-xs text-zinc-900' : 'border border-transparent text-stone-600 hover:bg-stone-200/50'}`}>
              <ListTodo className="w-4 h-4" /> Lista rzeczy
            </button>
          </div>
        </div>
    
        <div>
          <h3 className="text-xs font-semibold tracking-wider text-stone-500 uppercase mb-2 px-3">Harmonogram</h3>
          <SortableContext items={tripDays.map(d => d.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {tripDays.map((day) => (
                <SortableDayItem 
                  key={day.id}
                  day={day}
                  activeSection={activeSection}
                  setActiveSection={setActiveSection}
                  onFocusOnMap={onFocusOnMap}
                  isDropTarget={dropTargetDayId === day.id}
                  isDraggingItem={isDraggingItem}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
