import { useState, useRef, useEffect } from 'react';
import { Plane, Hotel, Bus, Plus, Trash2, Loader2 } from 'lucide-react';
import type { BudgetCategory, BudgetItem } from '../types/budget';
import { Button, EmptyState, IconButton, Input } from '../components/ui';
import { LAYER } from '../lib/layers';
import { DEFAULT_CURRENCY } from '../lib/constants';
import { searchAirports } from '../lib/geocoding';
import type { GeocodedPlace } from '../types/place';

interface FlightsAndHotelViewProps {
  customItems: BudgetItem[];
  setCustomItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
  currency?: string;
}

type BookingType = 'flight' | 'hotel' | 'transport';

const TYPES: { key: BookingType; label: string; category: BudgetCategory; icon: React.ReactNode }[] = [
  { key: 'flight', label: 'Lot', category: 'Loty', icon: <Plane className="w-4 h-4" /> },
  { key: 'hotel', label: 'Nocleg', category: 'Hotel', icon: <Hotel className="w-4 h-4" /> },
  { key: 'transport', label: 'Transport', category: 'Transport', icon: <Bus className="w-4 h-4" /> },
];

const BOOKING_CATEGORIES: BudgetCategory[] = ['Loty', 'Hotel', 'Transport'];

/** Pole lotniska: zapytania do API z debounce; spóźnione odpowiedzi są odrzucane. */
function AirportField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  const [results, setResults] = useState<GeocodedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);

  const cancelPending = () => {
    if (timer.current) clearTimeout(timer.current);
    controller.current?.abort();
    controller.current = null;
    requestId.current++;
  };

  useEffect(() => cancelPending, []);

  const handleChange = (text: string) => {
    onChange(text);
    cancelPending();
    const id = requestId.current;
    const query = text.trim();

    if (query.length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Stare podpowiedzi znikają od razu; do czasu odpowiedzi API pokazujemy spinner
    setResults([]);
    setIsLoading(true);
    timer.current = setTimeout(() => {
      const ctrl = new AbortController();
      controller.current = ctrl;
      searchAirports(query, 5, ctrl.signal)
        .then(res => { if (id === requestId.current) setResults(res); })
        .catch(() => { if (id === requestId.current) setResults([]); })
        .finally(() => { if (id === requestId.current) setIsLoading(false); });
    }, 400);
  };

  const select = (place: GeocodedPlace) => {
    cancelPending();
    onChange(place.displayName);
    setResults([]);
    setIsLoading(false);
  };

  return (
    <div className="relative flex-1 min-w-[160px]">
      <Input
        type="text"
        aria-label={label}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setResults([])}
        placeholder={placeholder}
        autoComplete="off"
        rightSlot={isLoading ? <Loader2 className="w-4 h-4 text-stone-400 animate-spin" /> : undefined}
      />
      {results.length > 0 && (
        <div className={`absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200/80 rounded-lg shadow-sm ${LAYER.dropdown} max-h-48 overflow-y-auto`}>
          {results.map((r) => (
            <button type="button" key={r.id} onMouseDown={(e) => { e.preventDefault(); select(r); }} className="block w-full text-left p-2.5 text-xs font-medium hover:bg-stone-100 cursor-pointer border-b border-stone-100 last:border-0 truncate transition-colors">
              {r.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FlightsAndHotelView({ customItems, setCustomItems, currency = DEFAULT_CURRENCY }: FlightsAndHotelViewProps) {
  const [type, setType] = useState<BookingType>('flight');

  const [flightFrom, setFlightFrom] = useState('');
  const [flightTo, setFlightTo] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [transportName, setTransportName] = useState('');
  const [cost, setCost] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cost) return;

    let newItem: BudgetItem;
    if (type === 'flight') {
      if (!flightFrom || !flightTo) return;
      newItem = {
        id: `flight-${Date.now()}`,
        title: `Lot: ${flightFrom.split(',')[0]} → ${flightTo.split(',')[0]}`,
        category: 'Loty',
        cost: Number(cost),
        currency,
      };
      setFlightFrom('');
      setFlightTo('');
    } else if (type === 'hotel') {
      if (!hotelName.trim()) return;
      newItem = {
        id: `hotel-${Date.now()}`,
        title: `Hotel: ${hotelName}`,
        category: 'Hotel',
        cost: Number(cost),
        currency,
      };
      setHotelName('');
    } else {
      if (!transportName.trim()) return;
      newItem = {
        id: `transport-${Date.now()}`,
        title: `Transport: ${transportName}`,
        category: 'Transport',
        cost: Number(cost),
        currency,
      };
      setTransportName('');
    }

    setCustomItems([...customItems, newItem]);
    setCost('');
  };

  const removeItem = (id: string) => {
    setCustomItems(customItems.filter(i => i.id !== id));
  };

  const bookings = customItems.filter(i => BOOKING_CATEGORIES.includes(i.category));
  const bookingsTotal = bookings.reduce((acc, i) => acc + (i.cost || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Loty i nocleg</h2>
          <p className="text-sm text-stone-500 mt-0.5">{bookings.length} {bookings.length === 1 ? 'rezerwacja' : 'rezerwacji'}</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-stone-500">Razem</div>
          <div className="text-lg font-semibold tracking-tight text-zinc-900 tabular-nums">{bookingsTotal} {currency}</div>
        </div>
      </div>

      {/* Inline form */}
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 py-3 border-y border-stone-200">
        <div role="tablist" aria-label="Typ rezerwacji" className="inline-flex p-0.5 bg-stone-200/60 rounded-lg shrink-0">
          {TYPES.map(t => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={type === t.key}
              onClick={() => setType(t.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${type === t.key ? 'bg-white text-zinc-900 shadow-xs' : 'text-stone-600 hover:text-zinc-900'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {type === 'flight' && (
          <>
            <AirportField label="Lotnisko wylotu" placeholder="Skąd? (np. KRK, Kraków)" value={flightFrom} onChange={setFlightFrom} />
            <AirportField label="Lotnisko docelowe" placeholder="Dokąd? (np. CTA, Katania)" value={flightTo} onChange={setFlightTo} />
          </>
        )}
        {type === 'hotel' && (
          <div className="flex-1 min-w-[200px]">
            <Input type="text" aria-label="Nazwa noclegu" value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="Nazwa hotelu / apartamentu" />
          </div>
        )}
        {type === 'transport' && (
          <div className="flex-1 min-w-[200px]">
            <Input type="text" aria-label="Opis transportu" value={transportName} onChange={(e) => setTransportName(e.target.value)} placeholder="np. Pociąg Kraków → Wrocław" />
          </div>
        )}

        <div className="w-32">
          <Input type="number" aria-label="Koszt rezerwacji" value={cost} onChange={(e) => setCost(e.target.value)} placeholder={`Koszt (${currency})`} />
        </div>
        <Button type="submit"><Plus className="w-4 h-4" /> Dodaj</Button>
      </form>

      {/* Lista rezerwacji */}
      {bookings.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bookings.map(item => {
            const t = TYPES.find(x => x.category === item.category) ?? TYPES[0];
            return (
              <li key={item.id} className="group flex items-stretch bg-white border border-stone-200 rounded-lg overflow-hidden hover:border-stone-300 transition-colors">
                <div className="flex items-center justify-center w-12 bg-stone-100 text-stone-600 border-r border-dashed border-stone-300 shrink-0">
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0 px-3 py-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{t.label}</div>
                  <div className="text-sm font-medium text-zinc-900 truncate">{item.title}</div>
                </div>
                <div className="flex items-center gap-1 pr-2 shrink-0">
                  <span className="text-sm font-semibold text-zinc-900 tabular-nums">{item.cost} {currency}</span>
                  <IconButton label="Usuń rezerwację" variant="danger" onClick={() => removeItem(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState compact title="Brak zaplanowanych rezerwacji." description="Wybierz typ i dodaj pierwszą rezerwację powyżej." />
      )}
    </div>
  );
}
