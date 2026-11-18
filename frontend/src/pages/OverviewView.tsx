import { CalendarDays, Wallet, MapPin, Luggage, ChevronRight, Plane, Hotel, Car, Shield, Bus, Tag } from 'lucide-react';
import type { BudgetCategory, BudgetItem } from '../types/budget';
import type { ScheduleItem, TripDay } from '../types/trip';
import { calculateBudgetSummary } from '../lib/budget';
import { DEFAULT_CURRENCY, DEFAULT_PIN_COLOR } from '../lib/constants';
import { EmptyState, ProgressBar } from '../components/ui';

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
  /** Dni wyjazdu do szybkiego podglądu harmonogramu. */
  days?: TripDay[];
  /** Przejście do widoku wybranego dnia (id dnia, np. 'd1'). */
  onSelectDay?: (dayId: string) => void;
}

const CATEGORY_ICONS: Partial<Record<BudgetCategory, React.ReactNode>> = {
  Loty: <Plane className="w-3.5 h-3.5" />,
  Hotel: <Hotel className="w-3.5 h-3.5" />,
  'Wynajem auta': <Car className="w-3.5 h-3.5" />,
  Ubezpieczenie: <Shield className="w-3.5 h-3.5" />,
  Transport: <Bus className="w-3.5 h-3.5" />,
};

const SectionLabel = ({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">{children}</h3>
    {aside && <span className="text-xs text-stone-400 tabular-nums">{aside}</span>}
  </div>
);

const Kpi = ({ icon, label, children, footer }: { icon: React.ReactNode; label: string; children: React.ReactNode; footer?: React.ReactNode }) => (
  <div className="px-4 py-3 min-w-0">
    <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500 [&>svg]:w-3.5 [&>svg]:h-3.5">
      {icon} {label}
    </div>
    <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-900 tabular-nums truncate">{children}</div>
    {footer && <div className="mt-1.5">{footer}</div>}
  </div>
);

export function OverviewView({
  destination,
  startDate,
  endDate,
  totalDays,
  totalBudget,
  currency = DEFAULT_CURRENCY,
  customItems = [],
  scheduleItems = [],
  packingItemsCount = 2,
  packedItemsCount = 1,
  days = [],
  onSelectDay,
}: OverviewViewProps) {
  const { totalSpent, remaining: remainingBudget, percentage } = calculateBudgetSummary(totalBudget, customItems, scheduleItems);
  const packedPercent = packingItemsCount > 0 ? Math.round((packedItemsCount / packingItemsCount) * 100) : 0;
  const dayWord = totalDays === 1 ? 'dzień' : 'dni';

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Przegląd wyjazdu</h2>
        <p className="text-sm text-stone-500 flex items-center gap-1.5 mt-0.5"><MapPin className="w-3.5 h-3.5" /> {destination}</p>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-stone-200 border-y border-stone-200 [&>*:nth-child(n+3)]:max-lg:border-t [&>*:nth-child(n+3)]:max-lg:border-stone-200">
        <Kpi icon={<CalendarDays />} label="Termin" footer={<span className="text-xs text-stone-500">{totalDays} {dayWord}</span>}>
          <span className="text-base">{startDate || 'Brak'} – {endDate || 'Brak'}</span>
        </Kpi>
        <Kpi
          icon={<Wallet />}
          label="Budżet pozostały"
          footer={<ProgressBar value={percentage} />}
        >
          <span className={remainingBudget < 0 ? 'text-red-600' : ''}>{remainingBudget} {currency}</span>
        </Kpi>
        <Kpi icon={<MapPin />} label="Zaplanowane punkty" footer={<span className="text-xs text-stone-500">w {days.filter(d => d.items.length > 0).length || 0} z {totalDays} dni</span>}>
          {scheduleItems.length}
        </Kpi>
        <Kpi icon={<Luggage />} label="Spakowane rzeczy" footer={<ProgressBar value={packedPercent} />}>
          {packedItemsCount} / {packingItemsCount}
        </Kpi>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-x-8 gap-y-6">
        {/* Harmonogram dzień po dniu */}
        <section className="lg:col-span-3">
          <SectionLabel aside={`${days.length} dni`}>Harmonogram</SectionLabel>
          {days.length > 0 ? (
            <ul className="divide-y divide-stone-200 border-y border-stone-200">
              {days.map(day => (
                <li key={day.id}>
                  <button
                    type="button"
                    onClick={() => onSelectDay?.(day.id)}
                    className="w-full flex items-start gap-3 px-1 py-3 text-left hover:bg-stone-100/60 transition-colors cursor-pointer group"
                  >
                    <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: day.color || DEFAULT_PIN_COLOR }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-zinc-900 truncate">{day.customTitle || `Dzień ${day.dayNumber}`}</span>
                        <span className="text-xs text-stone-400 tabular-nums shrink-0">{day.date}</span>
                      </span>
                      <span className="block text-xs text-stone-500 mt-0.5 truncate">
                        {day.items.length > 0
                          ? day.items.slice(0, 3).map(i => i.title).join(' · ') + (day.items.length > 3 ? ` · +${day.items.length - 3}` : '')
                          : 'Brak zaplanowanych punktów'}
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 mt-0.5 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact title="Brak dni w harmonogramie." description="Ustaw daty wyjazdu, aby zaplanować dni." />
          )}
        </section>

        {/* Rezerwacje + przygotowania */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <SectionLabel aside={`${customItems.length}`}>Rezerwacje i koszty stałe</SectionLabel>
            {customItems.length > 0 ? (
              <ul className="divide-y divide-stone-200 border-y border-stone-200 max-h-64 overflow-y-auto">
                {customItems.map(item => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-1 py-2.5 text-sm">
                    <span className="flex items-center gap-2 min-w-0 text-stone-700">
                      <span className="text-stone-400 shrink-0">{CATEGORY_ICONS[item.category] ?? <Tag className="w-3.5 h-3.5" />}</span>
                      <span className="truncate">{item.title}</span>
                    </span>
                    <span className="font-medium text-zinc-900 tabular-nums shrink-0">{item.cost} {currency}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact title="Brak rezerwacji." description="Dodaj je w zakładce Loty i nocleg." />
            )}
          </section>

          <section>
            <SectionLabel>Status przygotowań</SectionLabel>
            <dl className="divide-y divide-stone-200 border-y border-stone-200 text-sm">
              <div className="flex items-center justify-between px-1 py-2.5">
                <dt className="text-stone-600">Spakowane rzeczy</dt>
                <dd className="font-medium text-zinc-900 tabular-nums">{packedItemsCount} / {packingItemsCount} ({packedPercent}%)</dd>
              </div>
              <div className="flex items-center justify-between px-1 py-2.5">
                <dt className="text-stone-600">Wydano z budżetu</dt>
                <dd className="font-medium text-zinc-900 tabular-nums">{totalSpent} / {totalBudget} {currency}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
