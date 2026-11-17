import { useState, useRef } from 'react';
import { Plane, Hotel, Plus, Trash2 } from 'lucide-react';
import type { BudgetItem } from '../types/budget';
import { Button, Card, EmptyState, IconButton, Input, SectionHeader } from '../components/ui';
import { LAYER } from '../lib/layers';
import { DEFAULT_CURRENCY } from '../lib/constants';
import { searchAirports } from '../lib/geocoding';
import type { GeocodedPlace } from '../types/place';

interface FlightsAndHotelViewProps {
  customItems: BudgetItem[];
  setCustomItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
  currency?: string;
}

export function FlightsAndHotelView({ customItems, setCustomItems, currency = DEFAULT_CURRENCY }: FlightsAndHotelViewProps) {
  const [flightFrom, setFlightFrom] = useState('');
  const [flightTo, setFlightTo] = useState('');
  const [flightCost, setFlightCost] = useState('');
  
  const [hotelName, setHotelName] = useState('');
  const [hotelCost, setHotelCost] = useState('');

  const [fromResults, setFromResults] = useState<GeocodedPlace[]>([]);
  const [toResults, setToResults] = useState<GeocodedPlace[]>([]);
  const fromTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchAirport = (query: string, setter: (res: GeocodedPlace[]) => void) => {
    if (query.trim().length < 3) {
      setter([]);
      return;
    }
    searchAirports(query)
      .then(setter)
      .catch(() => setter([]));
  };

  const handleAddFlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightFrom || !flightTo || !flightCost) return;

    const newItem: BudgetItem = {
      id: `flight-${Date.now()}`,
      title: `Lot: ${flightFrom.split(',')[0]} → ${flightTo.split(',')[0]}`,
      category: 'Loty',
      cost: Number(flightCost),
      currency
    };

    setCustomItems([...customItems, newItem]);
    setFlightFrom('');
    setFlightTo('');
    setFlightCost('');
  };

  const handleAddHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelName.trim() || !hotelCost) return;

    const newItem: BudgetItem = {
      id: `hotel-${Date.now()}`,
      title: `Hotel: ${hotelName}`,
      category: 'Hotel',
      cost: Number(hotelCost),
      currency
    };

    setCustomItems([...customItems, newItem]);
    setHotelName('');
    setHotelCost('');
  };

  const removeItem = (id: string) => {
    setCustomItems(customItems.filter(i => i.id !== id));
  };

  const flightsAndHotels = customItems.filter(i => i.category === 'Loty' || i.category === 'Hotel');

  return (
    <div className="max-w-4xl mx-auto p-5 space-y-5">

      <Card padding="lg">
        <SectionHeader
          size="sm"
          align="left"
          icon={<Plane />}
          title="Loty i Nocleg"
          description="Zarządzaj rezerwacjami transportu lotniczego oraz miejscami noclegowymi."
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <Card className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-2">
            <Plane className="w-4 h-4 text-stone-600" /> Dodaj Lot
          </h3>
          <form onSubmit={handleAddFlight} className="space-y-3 relative">
            <div className="relative">
              <Input
                type="text"
                aria-label="Lotnisko wylotu"
                value={flightFrom}
                onChange={(e) => {
                  setFlightFrom(e.target.value);
                  if (fromTimeout.current) clearTimeout(fromTimeout.current);
                  fromTimeout.current = setTimeout(() => searchAirport(e.target.value, setFromResults), 400);
                }}
                placeholder="Skąd? (np. Warszawa-Okęcie)"
              />
              {fromResults.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200/80 rounded-lg shadow-sm ${LAYER.dropdown} max-h-40 overflow-y-auto`}>
                  {fromResults.map((r) => (
                    <button type="button" key={r.id} onClick={() => { setFlightFrom(r.displayName); setFromResults([]); }} className="block w-full text-left p-2.5 text-xs font-medium hover:bg-stone-100 cursor-pointer border-b border-stone-100 last:border-0 truncate transition-colors">
                      {r.displayName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Input
                type="text"
                aria-label="Lotnisko docelowe"
                value={flightTo}
                onChange={(e) => {
                  setFlightTo(e.target.value);
                  if (toTimeout.current) clearTimeout(toTimeout.current);
                  toTimeout.current = setTimeout(() => searchAirport(e.target.value, setToResults), 400);
                }}
                placeholder="Dokąd? (np. Katania)"
              />
              {toResults.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200/80 rounded-lg shadow-sm ${LAYER.dropdown} max-h-40 overflow-y-auto`}>
                  {toResults.map((r) => (
                    <button type="button" key={r.id} onClick={() => { setFlightTo(r.displayName); setToResults([]); }} className="block w-full text-left p-2.5 text-xs font-medium hover:bg-stone-100 cursor-pointer border-b border-stone-100 last:border-0 truncate transition-colors">
                      {r.displayName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Input
              type="number"
              aria-label="Koszt lotu"
              value={flightCost}
              onChange={(e) => setFlightCost(e.target.value)}
              placeholder={`Koszt (${currency})`}
            />

            <Button type="submit" fullWidth>
              <Plus className="w-4 h-4" /> Dodaj lot
            </Button>
          </form>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-2">
            <Hotel className="w-4 h-4 text-stone-600" /> Dodaj Nocleg / Hotel
          </h3>
          <form onSubmit={handleAddHotel} className="space-y-3">
            <Input
              type="text"
              aria-label="Nazwa noclegu"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="Nazwa hotelu / apartamentu"
            />
            <Input
              type="number"
              aria-label="Koszt noclegu"
              value={hotelCost}
              onChange={(e) => setHotelCost(e.target.value)}
              placeholder={`Całkowity koszt noclegu (${currency})`}
            />
            <div className="pt-9">
              <Button type="submit" fullWidth>
                <Plus className="w-4 h-4" /> Dodaj nocleg
              </Button>
            </div>
          </form>
        </Card>

      </div>

      <Card className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-2">
          <Plane className="w-4 h-4 text-stone-600" /> Twoje rezerwacje lotów i hoteli
        </h3>

        <div className="divide-y divide-stone-200 border-y border-stone-200">
          {flightsAndHotels.length > 0 ? (
            flightsAndHotels.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-1 py-3 hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-stone-100 p-2.5 rounded-lg text-stone-600">
                    {item.category === 'Loty' ? <Plane className="w-4 h-4" /> : <Hotel className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 text-sm">{item.title}</div>
                    <div className="text-xs text-stone-500 uppercase font-semibold tracking-wider">{item.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-zinc-900 text-sm">{item.cost} {currency}</span>
                  <IconButton label="Usuń rezerwację" variant="danger" onClick={() => removeItem(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              compact
              title="Brak zaplanowanych lotów lub hoteli."
              description="Użyj formularzy powyżej, aby je dodać."
            />
          )}
        </div>
      </Card>

    </div>
  );
}
