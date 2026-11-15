import { useState } from 'react';
import { Wallet, Plus, PieChart, Tag, Receipt, Plane, Hotel, Edit2, Check, Shield, Car, Bus } from 'lucide-react';

export interface BudgetItem {
  id: string;
  title: string;
  category: string;
  cost: number;
  currency: string;
}

interface BudgetViewProps {
  tripId?: string;
  budget: number;
  setBudget: (val: number) => void;
  currency?: string;
  scheduleItems?: Array<{ id: string; title: string; cost?: number }>;
  customItems: BudgetItem[];
  setCustomItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
}

export function BudgetView({ 
  tripId = '1',
  budget, 
  setBudget, 
  currency = 'PLN', 
  scheduleItems = [], 
  customItems, 
  setCustomItems 
}: BudgetViewProps) {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetValueInput, setBudgetValueInput] = useState(String(budget));

  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Jedzenie');

  const activeScheduleItems = scheduleItems.filter(item => (item.cost || 0) > 0);
  const scheduleTotal = activeScheduleItems.reduce((acc, item) => acc + (item.cost || 0), 0);
  const customTotal = customItems.reduce((acc, item) => acc + item.cost, 0);
  const totalSpent = scheduleTotal + customTotal;
  
  const percentage = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0;

  // Funkcja mapująca kategorie na odpowiednie ikonki i kolory tła
  const getCategoryIcon = (category: string) => {
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
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fadeIn">
      {/* Nagłówek i Statystyki */}
      <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Wallet className="w-6 h-6 text-emerald-500" /> Budżet wyjazdu
            </h2>
            <p className="text-slate-500 text-sm mt-1">Zarządzaj finansami, kontroluj koszty stałe i wydatki na miejscu.</p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between gap-2">
                <span>Całkowity budżet</span>
                {!isEditingBudget ? (
                  <button 
                    onClick={() => { setBudgetValueInput(String(budget)); setIsEditingBudget(true); }}
                    className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    title="Edytuj budżet"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                ) : null}
              </div>

              {isEditingBudget ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <input 
                    type="number"
                    value={budgetValueInput}
                    onChange={(e) => setBudgetValueInput(e.target.value)}
                    className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                  <button 
                    onClick={handleSaveBudget}
                    className="p-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-xl font-black text-slate-900">{budget} {currency}</div>
              )}
            </div>

            <div className="w-px h-8 bg-slate-200"></div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pozostało</div>
              <div className={`text-xl font-black ${budget - totalSpent < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {budget - totalSpent} {currency}
              </div>
            </div>
          </div>
        </div>

        {/* Pasek postępu */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600">Wydano łącznie: <strong className="text-slate-900">{totalSpent} {currency}</strong> ({percentage}%)</span>
            <span className="text-slate-400">Limit: {budget} {currency}</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${percentage > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Rejestr wydatków i Formularz */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          
          {/* Koszty stałe / Loty, hotele, ubezpieczenie i auto */}
          <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Plane className="w-4 h-4 text-emerald-500" /> Loty, hotele, ubezpieczenie i auto
            </h3>
            
            <div className="space-y-3">
              {customItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/60 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100/80 p-2.5 rounded-xl text-emerald-600">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                      <div className="text-xs text-slate-400">{item.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 text-sm">{item.cost} {currency}</span>
                    <button 
                      onClick={() => removeCustomItem(item.id)}
                      className="text-slate-300 hover:text-red-500 text-xs font-bold p-1 cursor-pointer transition-colors"
                      title="Usuń"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Atrakcje z harmonogramu */}
          <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-500" /> Atrakcje z harmonogramu
            </h3>
            
            <div className="space-y-3">
              {activeScheduleItems.length > 0 ? (
                activeScheduleItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/60 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100/80 p-2.5 rounded-xl text-blue-600"><Receipt className="w-4 h-4" /></div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                        <div className="text-xs text-slate-400">Pobrano z planu dnia</div>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-sm">{item.cost} {currency}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 p-4 bg-slate-50/50 rounded-2xl text-center">
                  Brak przypisanych kosztów w atrakcjach harmonogramu. Edytuj kafelek atrakcji (np. Wawel), aby dodać koszt.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Formularz dodawania wydatku z nowymi kategoriami */}
        <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm h-fit space-y-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-slate-400" /> Dodaj wydatek
          </h3>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Tytuł</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="np. Ubezpieczenie Allianz, Fiat Panda" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Kwota ({currency})</label>
              <input 
                type="number" 
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="250" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Kategoria</label>
              <select 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Loty">Loty</option>
                <option value="Hotel">Hotel</option>
                <option value="Wynajem auta">Wynajem auta</option>
                <option value="Ubezpieczenie">Ubezpieczenie</option>
                <option value="Transport">Transport</option>
                <option value="Jedzenie">Jedzenie</option>
                <option value="Atrakcje">Atrakcje</option>
                <option value="Inne">Inne</option>
              </select>
            </div>
            <button 
              type="submit"
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Dodaj do budżetu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}