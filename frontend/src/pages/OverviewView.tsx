import { MapPin, Wallet, CheckCircle2, Plane, Hotel, Receipt, Tag } from 'lucide-react';

interface OverviewViewProps {
  tripTitle: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalBudget: number;
  currency?: string;
  customItems: Array<{ id: string; title: string; category: string; cost: number }>;
  scheduleItems: Array<{ id: string; title: string; cost?: number; time?: string }>;
  packingItemsCount?: number;
  packedItemsCount?: number;
}

export function OverviewView({ 
  tripTitle, 
  destination, 
  startDate, 
  endDate, 
  totalDays,
  totalBudget,
  currency = 'PLN',
  customItems = [],
  scheduleItems = [],
  packingItemsCount = 2,
  packedItemsCount = 1
}: OverviewViewProps) {
  
  // Obliczenia finansowe
  const customTotal = customItems.reduce((acc, item) => acc + item.cost, 0);
  const scheduleCostTotal = scheduleItems.reduce((acc, item) => acc + (item.cost || 0), 0);
  const totalSpent = scheduleCostTotal + customTotal;
  const remainingBudget = totalBudget - totalSpent;
  const percentage = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fadeIn">
      
      {/* Czysty, nowoczesny nagłówek bez sztucznych bajerów AI */}
      <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">{tripTitle}</h2>
          <p className="text-slate-500 flex items-center gap-2 text-sm font-medium">
            <MapPin className="w-4 h-4 text-emerald-500" /> {destination}
          </p>
        </div>

        <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Termin wyjazdu</div>
            <div className="text-sm font-extrabold text-slate-800 mt-0.5">{startDate || 'Brak'} – {endDate || 'Brak'}</div>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Czas trwania</div>
            <div className="text-sm font-extrabold text-slate-800 mt-0.5">{totalDays} {totalDays === 1 ? 'dzień' : totalDays < 5 ? 'dni' : 'dni'}</div>
          </div>
        </div>
      </div>

      {/* Szybkie podsumowanie budżetu */}
      <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 shadow-sm space-y-6">
        <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-500" /> Podsumowanie Finansowe
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Budżet całkowity</div>
            <div className="text-xl font-black text-slate-900 mt-1">{totalBudget} {currency}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Wydano łącznie</div>
            <div className="text-xl font-black text-slate-900 mt-1">{totalSpent} {currency}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pozostało</div>
            <div className={`text-xl font-black mt-1 ${remainingBudget < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {remainingBudget} {currency}
            </div>
          </div>
        </div>

        {/* Pasek postępu wydatków */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>Wykorzystanie budżetu ({percentage}%)</span>
            <span>Limit: {totalBudget} {currency}</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${percentage > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Koszty stałe i Atrakcje w harmonogramie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-4">
          <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Plane className="w-4 h-4 text-emerald-500" /> Rezerwacje i koszty stałe ({customItems.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {customItems.length > 0 ? (
              customItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                  <span className="font-medium text-slate-700 truncate pr-2">{item.title}</span>
                  <span className="font-bold text-slate-900 shrink-0">{item.cost} {currency}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-2">Brak dodanych kosztów stałych.</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-4">
          <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-500" /> Atrakcje w harmonogramie ({scheduleItems.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {scheduleItems.length > 0 ? (
              scheduleItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 truncate">{item.title}</span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    {item.cost && item.cost > 0 ? `${item.cost} ${currency}` : 'Bezpłatnie'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-2">Brak atrakcji w planie dni. Wyszukaj i dodaj miejsca w harmonogramie.</div>
            )}
          </div>
        </div>
      </div>

      {/* Status przygotowań */}
      <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-4">
        <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Status przygotowań
        </h3>
        <div className="max-w-md">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
            <span className="font-medium text-slate-700">Spakowane rzeczy w walizce</span>
            <span className="font-bold text-slate-700">{packedItemsCount} / {packingItemsCount} pozycji</span>
          </div>
        </div>
      </div>
    </div>
  );
}