import { useState, useRef } from 'react';
import { Plane, Hotel, Plus, Trash2 } from 'lucide-react';
import type { BudgetItem } from './BudgetView';

interface FlightsAndHotelViewProps {
  customItems: BudgetItem[];
  setCustomItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
  currency?: string;
}

export function FlightsAndHotelView({ customItems, setCustomItems, currency = 'PLN' }: FlightsAndHotelViewProps) {
  const [flightFrom, setFlightFrom] = useState('');
  const [flightTo, setFlightTo] = useState('');
  const [flightCost, setFlightCost] = useState('');
  
  const [hotelName, setHotelName] = useState('');
  const [hotelCost, setHotelCost] = useState('');

  const [fromResults, setFromResults] = useState<any[]>([]);
  const [toResults, setToResults] = useState<any[]>([]);
  const fromTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchAirport = (query: string, setter: (res: any[]) => void) => {
    if (query.trim().length < 3) {
      setter([]);
      return;
    }
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' lotnisko airport')}&limit=5&accept-language=pl`)
      .then(res => res.json())
      .then(data => setter(data || []))
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
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fadeIn">
      
      <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Plane className="w-6 h-6 text-emerald-500" /> Loty i Nocleg
        </h2>
        <p className="text-slate-500 text-sm mt-1">Zarządzaj rezerwacjami transportu lotniczego oraz miejscami noclegowymi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Plane className="w-4 h-4 text-emerald-500" /> Dodaj Lot
          </h3>
          <form onSubmit={handleAddFlight} className="space-y-3 relative">
            <div className="relative">
              <input 
                type="text"
                value={flightFrom}
                onChange={(e) => {
                  setFlightFrom(e.target.value);
                  if (fromTimeout.current) clearTimeout(fromTimeout.current);
                  fromTimeout.current = setTimeout(() => searchAirport(e.target.value, setFromResults), 400);
                }}
                placeholder="Skąd? (np. Warszawa-Okęcie)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {fromResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-40 overflow-y-auto">
                  {fromResults.map((r, i) => (
                    <div key={i} onClick={() => { setFlightFrom(r.display_name); setFromResults([]); }} className="p-2.5 text-xs font-medium hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 truncate">
                      {r.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <input 
                type="text"
                value={flightTo}
                onChange={(e) => {
                  setFlightTo(e.target.value);
                  if (toTimeout.current) clearTimeout(toTimeout.current);
                  toTimeout.current = setTimeout(() => searchAirport(e.target.value, setToResults), 400);
                }}
                placeholder="Dokąd? (np. Katania)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {toResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-40 overflow-y-auto">
                  {toResults.map((r, i) => (
                    <div key={i} onClick={() => { setFlightTo(r.display_name); setToResults([]); }} className="p-2.5 text-xs font-medium hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 truncate">
                      {r.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input 
              type="number"
              value={flightCost}
              onChange={(e) => setFlightCost(e.target.value)}
              placeholder="Koszt (PLN)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <button type="submit" className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Dodaj lot
            </button>
          </form>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Hotel className="w-4 h-4 text-emerald-500" /> Dodaj Nocleg / Hotel
          </h3>
          <form onSubmit={handleAddHotel} className="space-y-3">
            <input 
              type="text"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="Nazwa hotelu / apartamentu"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input 
              type="number"
              value={hotelCost}
              onChange={(e) => setHotelCost(e.target.value)}
              placeholder="Całkowity koszt noclegu (PLN)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="pt-9">
              <button type="submit" className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Dodaj nocleg
              </button>
            </div>
          </form>
        </div>

      </div>

      <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-4">
        <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
          <Plane className="w-4 h-4 text-emerald-500" /> Twoje rezerwacje lotów i hoteli
        </h3>
        
        <div className="space-y-3">
          {flightsAndHotels.length > 0 ? (
            flightsAndHotels.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/60 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
                    {item.category === 'Loty' ? <Plane className="w-4 h-4" /> : <Hotel className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                    <div className="text-xs text-slate-400 uppercase font-bold">{item.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-slate-900 text-sm">{item.cost} {currency}</span>
                  <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 text-xs font-bold p-1 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 p-4 bg-slate-50/50 rounded-2xl text-center italic">
              Brak zaplanowanych lotów lub hoteli. Użyj formularzy powyżej, aby je dodać.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}