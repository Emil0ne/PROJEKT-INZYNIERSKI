import { useState } from 'react';
import { Plus, Tag, Receipt, Plane, Hotel, Edit2, Check, Shield, Car, Bus, Trash2 } from 'lucide-react';
import { Button, EmptyState, IconButton, Input, ProgressBar, Select } from '../components/ui';
import { BUDGET_CATEGORIES, type BudgetCategory, type BudgetItem } from '../types/budget';
import type { ScheduleItem } from '../types/trip';
import { calculateBudgetSummary } from '../lib/budget';
import { DEFAULT_CURRENCY } from '../lib/constants';

interface BudgetViewProps {
  tripId?: string;
  budget: number;
  setBudget: (val: number) => void;
  currency?: string;
  scheduleItems?: ScheduleItem[];
  customItems: BudgetItem[];
  setCustomItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
}

type Filter = 'all' | 'fixed' | 'schedule';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Wszystkie' },
  { key: 'fixed', label: 'Koszty stałe' },
  { key: 'schedule', label: 'Atrakcje z planu' },
];

interface ExpenseRow {
  id: string;
  title: string;
  subtitle: string;
  cost: number;
  icon: React.ReactNode;
  /** Tylko koszty stałe można usunąć. */
  removable: boolean;
}

export function BudgetView({
  tripId = '1',
  budget,
  setBudget,
  currency = DEFAULT_CURRENCY,
  scheduleItems = [],
  customItems,
  setCustomItems
}: BudgetViewProps) {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetValueInput, setBudgetValueInput] = useState(String(budget));
  const [filter, setFilter] = useState<Filter>('all');

  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newCategory, setNewCategory] = useState<BudgetCategory>('Jedzenie');

  const activeScheduleItems = scheduleItems.filter(item => (item.cost || 0) > 0);
  const { totalSpent, remaining, percentage } = calculateBudgetSummary(budget, customItems, activeScheduleItems);

  const getCategoryIcon = (category: BudgetCategory) => {
    switch (category) {
      case 'Loty':
        return <Plane className="w-4 h-4" />;
      case 'Hotel':
        return <Hotel className="w-4 h-4" />;
      case 'Wynajem auta':
        return <Car className="w-4 h-4" />;
      case 'Ubezpieczenie':
        return <Shield className="w-4 h-4" />;
      case 'Transport':
        return <Bus className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const syncWithBackend = async (updatedData: { totalBudget?: number; fixedExpenses?: BudgetItem[] }) => {
    try {
      const payload = {
        totalBudget: updatedData.totalBudget !== undefined ? updatedData.totalBudget : budget,
        currency,
        totalSpent,
        fixedExpenses: updatedData.fixedExpenses !== undefined ? updatedData.fixedExpenses : customItems,
        scheduleExpenses: activeScheduleItems,
      };

      console.log("✈️ [API AUTO-SAVE] Zsynchronizowano budżet z endpointem /api/trips/" + tripId + "/budget:", payload);
    } catch (error) {
      console.error("❌ Błąd synchronizacji budżetu:", error);
    }
  };

  const handleSaveBudget = () => {
    const val = Number(budgetValueInput);
    if (!isNaN(val) && val >= 0) {
      setBudget(val);
      syncWithBackend({ totalBudget: val });
    }
    setIsEditingBudget(false);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCost) return;
    const newItem: BudgetItem = {
      id: String(Date.now()),
      title: newTitle,
      category: newCategory,
      cost: Number(newCost),
      currency
    };
    const updated = [...customItems, newItem];
    setCustomItems(updated);
    setNewTitle('');
    setNewCost('');

    syncWithBackend({ fixedExpenses: updated });
  };

  const removeCustomItem = (id: string) => {
    const updated = customItems.filter(i => i.id !== id);
    setCustomItems(updated);

    syncWithBackend({ fixedExpenses: updated });
  };

  // Podsumowanie kategorii (koszty stałe + atrakcje z planu jako „Atrakcje”)
  const categoryTotals = BUDGET_CATEGORIES.map(category => {
    const fixed = customItems.filter(i => i.category === category).reduce((acc, i) => acc + (i.cost || 0), 0);
    const fromSchedule = category === 'Atrakcje' ? activeScheduleItems.reduce((acc, i) => acc + (i.cost || 0), 0) : 0;
    return { category, total: fixed + fromSchedule };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const fixedRows: ExpenseRow[] = customItems.map(item => ({
    id: item.id, title: item.title, subtitle: item.category, cost: item.cost, icon: getCategoryIcon(item.category), removable: true,
  }));
  const scheduleRows: ExpenseRow[] = activeScheduleItems.map(item => ({
    id: `s-${item.id}`, title: item.title, subtitle: 'Atrakcja z planu dnia', cost: item.cost, icon: <Receipt className="w-4 h-4" />, removable: false,
  }));
  const rows = filter === 'fixed' ? fixedRows : filter === 'schedule' ? scheduleRows : [...fixedRows, ...scheduleRows];
  const counts: Record<Filter, number> = { all: fixedRows.length + scheduleRows.length, fixed: fixedRows.length, schedule: scheduleRows.length };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Pasek finansowy */}
      <div>
        <div className="grid grid-cols-3 divide-x divide-stone-200 border-y border-stone-200">
          <div className="px-4 py-3 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
              Budżet całkowity
              {!isEditingBudget && (
                <IconButton label="Edytuj budżet" onClick={() => { setBudgetValueInput(String(budget)); setIsEditingBudget(true); }} className="p-0.5">
                  <Edit2 className="w-3 h-3" />
                </IconButton>
              )}
            </div>
            {isEditingBudget ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="number"
                  aria-label="Całkowity budżet"
                  value={budgetValueInput}
                  onChange={(e) => setBudgetValueInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveBudget(); }}
                  className="w-24 px-2 py-1 bg-white border border-stone-200/80 rounded-lg text-sm font-medium focus:outline-none focus:ring-4 focus:ring-zinc-900/10 focus:border-zinc-900"
                  autoFocus
                />
                <Button aria-label="Zapisz budżet" title="Zapisz budżet" onClick={handleSaveBudget} className="!p-1 rounded-lg">
                  <Check className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-900 tabular-nums truncate">{budget} {currency}</div>
            )}
          </div>
          <div className="px-4 py-3 min-w-0">
            <div className="text-xs font-medium text-stone-500">Wydano</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-900 tabular-nums truncate">{totalSpent} {currency}</div>
          </div>
          <div className="px-4 py-3 min-w-0">
            <div className="text-xs font-medium text-stone-500">Pozostało</div>
            <div className={`mt-1 text-lg font-semibold tracking-tight tabular-nums truncate ${remaining < 0 ? 'text-red-600' : 'text-zinc-900'}`}>{remaining} {currency}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1"><ProgressBar value={percentage} /></div>
          <span className="text-xs font-medium text-stone-500 tabular-nums shrink-0">{percentage}% wykorzystano</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Podsumowanie kategorii */}
          {categoryTotals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categoryTotals.map(({ category, total }) => (
                <span key={category} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-stone-200 text-xs text-stone-600">
                  {category} <strong className="font-semibold text-zinc-900 tabular-nums">{total} {currency}</strong>
                </span>
              ))}
            </div>
          )}

          {/* Filtry */}
          <div role="tablist" aria-label="Filtr wydatków" className="inline-flex p-0.5 bg-stone-200/60 rounded-lg">
            {FILTERS.map(f => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${filter === f.key ? 'bg-white text-zinc-900 shadow-xs' : 'text-stone-600 hover:text-zinc-900'}`}
              >
                {f.label} <span className="text-xs text-stone-400 tabular-nums">{counts[f.key]}</span>
              </button>
            ))}
          </div>

          {rows.length > 0 ? (
            <div className="divide-y divide-stone-200 border-y border-stone-200">
              {rows.map(row => (
                <div key={row.id} className="group flex items-center justify-between gap-3 px-1 py-2.5 hover:bg-stone-100/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-stone-100 p-2 rounded-lg text-stone-600 shrink-0">{row.icon}</div>
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-900 text-sm truncate">{row.title}</div>
                      <div className="text-xs text-stone-500">{row.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-zinc-900 text-sm tabular-nums">{row.cost} {currency}</span>
                    {row.removable ? (
                      <IconButton label="Usuń wydatek" variant="danger" onClick={() => removeCustomItem(row.id)}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    ) : (
                      <span className="w-[28px]" aria-hidden />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              title={filter === 'schedule' ? 'Brak kosztów w atrakcjach harmonogramu.' : 'Brak wydatków.'}
              description={filter === 'schedule' ? 'Edytuj kafelek atrakcji, aby dodać koszt.' : 'Dodaj pierwszy wydatek w formularzu obok.'}
            />
          )}
        </div>

        {/* Szybkie dodawanie */}
        <aside className="h-fit lg:sticky lg:top-0">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Dodaj wydatek</h3>
          <form onSubmit={handleAddExpense} className="space-y-3 p-4 bg-white border border-stone-200 rounded-lg">
            <Input
              aria-label="Tytuł wydatku"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Tytuł, np. Ubezpieczenie Allianz"
            />
            <div className="flex gap-2">
              <Input
                aria-label={`Kwota (${currency})`}
                type="number"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder={`Kwota (${currency})`}
              />
            </div>
            <Select
              aria-label="Kategoria"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as BudgetCategory)}
            >
              {BUDGET_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
            <Button type="submit" fullWidth>
              <Plus className="w-4 h-4" /> Dodaj do budżetu
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
