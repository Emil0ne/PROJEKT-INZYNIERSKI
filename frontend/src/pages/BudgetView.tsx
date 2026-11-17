import { useState } from 'react';
import { Wallet, Plus, PieChart, Tag, Receipt, Plane, Hotel, Edit2, Check, Shield, Car, Bus, Trash2 } from 'lucide-react';
import { Button, Card, EmptyState, IconButton, Input, ProgressBar, SectionHeader, Select } from '../components/ui';
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

  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newCategory, setNewCategory] = useState<BudgetCategory>('Jedzenie');

  const activeScheduleItems = scheduleItems.filter(item => (item.cost || 0) > 0);
  const { totalSpent, remaining, percentage } = calculateBudgetSummary(budget, customItems, activeScheduleItems);

  // Funkcja mapująca kategorie na odpowiednie ikonki i kolory tła
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
      case 'Atrakcje':
        return <Tag className="w-4 h-4" />;
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

  return (
    <div className="max-w-4xl mx-auto p-5 space-y-5">
      {/* Nagłówek i Statystyki */}
      <Card padding="lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <SectionHeader
            size="sm"
            align="left"
            icon={<Wallet />}
            title="Budżet wyjazdu"
            description="Zarządzaj finansami, kontroluj koszty stałe i wydatki na miejscu."
          />

          <div className="flex items-center gap-4 bg-stone-50/80 p-4 rounded-lg border border-stone-200/80">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center justify-between gap-2">
                <span>Całkowity budżet</span>
                {!isEditingBudget ? (
                  <IconButton
                    label="Edytuj budżet"
                    onClick={() => { setBudgetValueInput(String(budget)); setIsEditingBudget(true); }}
                    className="p-0.5"
                  >
                    <Edit2 className="w-3 h-3" />
                  </IconButton>
                ) : null}
              </div>

              {isEditingBudget ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="number"
                    aria-label="Całkowity budżet"
                    value={budgetValueInput}
                    onChange={(e) => setBudgetValueInput(e.target.value)}
                    className="w-24 px-2 py-1 bg-white border border-stone-200/80 rounded-lg text-sm font-medium focus:outline-none focus:ring-4 focus:ring-zinc-900/10 focus:border-zinc-900"
                    autoFocus
                  />
                  <Button aria-label="Zapisz budżet" title="Zapisz budżet" onClick={handleSaveBudget} className="!p-1 rounded-lg">
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="text-xl font-semibold text-zinc-900">{budget} {currency}</div>
              )}
            </div>

            <div className="w-px h-8 bg-stone-200"></div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">Pozostało</div>
              <div className={`text-xl font-semibold ${remaining < 0 ? 'text-red-600' : 'text-zinc-900'}`}>
                {remaining} {currency}
              </div>
            </div>
          </div>
        </div>

        {/* Pasek postępu */}
        <div className="space-y-2 pt-2 border-t border-stone-100">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-stone-600">Wydano łącznie: <strong className="text-zinc-900">{totalSpent} {currency}</strong> ({percentage}%)</span>
            <span className="text-stone-400">Limit: {budget} {currency}</span>
          </div>
          <ProgressBar value={percentage} />
        </div>
      </Card>

      {/* Rejestr wydatków i Formularz */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-6">

          {/* Koszty stałe / Loty, hotele, ubezpieczenie i auto */}
          <Card className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-2">
              <Plane className="w-4 h-4 text-stone-600" /> Loty, hotele, ubezpieczenie i auto
            </h3>

            <div className="divide-y divide-stone-200 border-y border-stone-200">
              {customItems.length > 0 ? customItems.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-1 py-3 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-stone-100 p-2 rounded-lg text-stone-600">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-900 text-sm">{item.title}</div>
                      <div className="text-xs text-stone-500">{item.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-zinc-900 text-sm">{item.cost} {currency}</span>
                    <IconButton label="Usuń wydatek" variant="danger" onClick={() => removeCustomItem(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>
              )) : (
                <EmptyState compact title="Brak kosztów stałych." description="Dodaj pierwszy wydatek w formularzu obok." />
              )}
            </div>
          </Card>

          {/* Atrakcje z harmonogramu */}
          <Card className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-stone-500" /> Atrakcje z harmonogramu
            </h3>

            <div className="divide-y divide-stone-200 border-y border-stone-200">
              {activeScheduleItems.length > 0 ? (
                activeScheduleItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 px-1 py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-stone-100 p-2 rounded-lg text-stone-600"><Receipt className="w-4 h-4" /></div>
                      <div>
                        <div className="font-medium text-zinc-900 text-sm">{item.title}</div>
                        <div className="text-xs text-stone-500">Pobrano z planu dnia</div>
                      </div>
                    </div>
                    <span className="font-semibold text-zinc-900 text-sm">{item.cost} {currency}</span>
                  </div>
                ))
              ) : (
                <EmptyState
                  compact
                  title="Brak przypisanych kosztów w atrakcjach harmonogramu."
                  description="Edytuj kafelek atrakcji (np. Wawel), aby dodać koszt."
                />
              )}
            </div>
          </Card>

        </div>

        {/* Formularz dodawania wydatku z nowymi kategoriami */}
        <Card className="h-fit space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-stone-400" /> Dodaj wydatek
          </h3>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <Input
              label="Tytuł"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="np. Ubezpieczenie Allianz, Fiat Panda"
            />
            <Input
              label={`Kwota (${currency})`}
              type="number"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              placeholder="250"
            />
            <Select
              label="Kategoria"
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
        </Card>
      </div>
    </div>
  );
}
