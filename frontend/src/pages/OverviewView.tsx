import { MapPin, Wallet, CheckCircle2, Plane, Receipt, Tag } from 'lucide-react';
import type { BudgetItem } from '../types/budget';
import type { ScheduleItem } from '../types/trip';
import { calculateBudgetSummary } from '../lib/budget';
import { DEFAULT_CURRENCY } from '../lib/constants';
import { Card, EmptyState, ProgressBar } from '../components/ui';

interface OverviewViewProps {
  tripTitle: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalBudget: number;
  currency?: string;
  customItems: BudgetItem[];
  scheduleItems: ScheduleItem[];
  packingItemsCount?: number;
  packedItemsCount?: number;
}

const StatLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{children}</div>
);

export function OverviewView({
  tripTitle,
  destination,
  startDate,
  endDate,
  totalDays,
  totalBudget,
  currency = DEFAULT_CURRENCY,
  customItems = [],
  scheduleItems = [],
  packingItemsCount = 2,
  packedItemsCount = 1
}: OverviewViewProps) {

  // Obliczenia finansowe
  const { totalSpent, remaining: remainingBudget, percentage } = calculateBudgetSummary(totalBudget, customItems, scheduleItems);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fadeIn">

      <Card padding="lg" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">{tripTitle}</h2>
          <p className="text-slate-500 flex items-center gap-2 text-sm font-medium">
            <MapPin className="w-4 h-4 text-emerald-500" /> {destination}
          </p>
        </div>

        <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div>
            <StatLabel>Termin wyjazdu</StatLabel>
            <div className="text-sm font-extrabold text-slate-800 mt-0.5">{startDate || 'Brak'} – {endDate || 'Brak'}</div>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div>
            <StatLabel>Czas trwania</StatLabel>
            <div className="text-sm font-extrabold text-slate-800 mt-0.5">{totalDays} {totalDays === 1 ? 'dzień' : totalDays < 5 ? 'dni' : 'dni'}</div>
          </div>
        </div>
      </Card>

      {/* Szybkie podsumowanie budżetu */}
      <Card padding="lg" className="space-y-6">
        <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-500" /> Podsumowanie Finansowe
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <StatLabel>Budżet całkowity</StatLabel>
            <div className="text-xl font-black text-slate-900 mt-1">{totalBudget} {currency}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <StatLabel>Wydano łącznie</StatLabel>
            <div className="text-xl font-black text-slate-900 mt-1">{totalSpent} {currency}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <StatLabel>Pozostało</StatLabel>
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
          <ProgressBar value={percentage} />
        </div>
      </Card>

      {/* Koszty stałe i Atrakcje w harmonogramie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
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
              <EmptyState compact title="Brak dodanych kosztów stałych." />
            )}
          </div>
        </Card>

        <Card className="space-y-4">
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
              <EmptyState compact title="Brak atrakcji w planie dni." description="Wyszukaj i dodaj miejsca w harmonogramie." />
            )}
          </div>
        </Card>
      </div>

      {/* Status przygotowań */}
      <Card className="space-y-4">
        <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Status przygotowań
        </h3>
        <div className="max-w-md">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-sm">
            <span className="font-medium text-slate-700">Spakowane rzeczy w walizce</span>
            <span className="font-bold text-slate-700">{packedItemsCount} / {packingItemsCount} pozycji</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
