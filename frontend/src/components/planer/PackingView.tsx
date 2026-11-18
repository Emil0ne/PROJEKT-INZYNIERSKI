import { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { Button, EmptyState, IconButton, Input, ProgressBar } from '../ui';
import type { PackingItem } from '../../types/trip';

interface PackingViewProps {
  items: PackingItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (text: string) => void;
}

/** Gotowe zestawy do jednoklikowego dodania. */
const PACKING_PRESETS: { label: string; items: string[] }[] = [
  { label: 'Dokumenty', items: ['Paszport / dowód osobisty', 'Bilety i rezerwacje', 'Ubezpieczenie podróżne', 'Karta płatnicza i gotówka'] },
  { label: 'Elektronika', items: ['Telefon i ładowarka', 'Powerbank', 'Adapter do gniazdka', 'Słuchawki'] },
  { label: 'Kosmetyki', items: ['Szczoteczka i pasta do zębów', 'Szampon i żel pod prysznic', 'Krem z filtrem', 'Dezodorant'] },
  { label: 'Apteczka', items: ['Leki na receptę', 'Plastry', 'Środki przeciwbólowe'] },
];

/** Lista rzeczy do spakowania: odhaczanie, usuwanie i dodawanie pozycji. */
export function PackingView({ items, onToggle, onDelete, onAdd }: PackingViewProps) {
  const [newItemText, setNewItemText] = useState('');

  const packedCount = items.filter(i => i.packed).length;
  const percent = items.length > 0 ? Math.round((packedCount / items.length) * 100) : 0;
  const existing = new Set(items.map(i => i.text.trim().toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    onAdd(newItemText);
    setNewItemText('');
  };

  const addPreset = (preset: { items: string[] }) => {
    preset.items.filter(text => !existing.has(text.toLowerCase())).forEach(onAdd);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Lista rzeczy</h2>
          <p className="text-sm text-stone-500 mt-0.5 tabular-nums">Spakowano {packedCount} z {items.length} • {percent}%</p>
        </div>
        <div className="w-40 sm:w-64 pb-1.5"><ProgressBar value={percent} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
        <section className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
            <div className="flex-1">
              <Input type="text" aria-label="Nowa rzecz do spakowania" icon={<Plus />} value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="Dodaj rzecz i naciśnij Enter..." />
            </div>
            <Button type="submit">Dodaj</Button>
          </form>

          {items.length > 0 ? (
            <div className="divide-y divide-stone-200 border-y border-stone-200">
              {items.map(item => (
                <div key={item.id} onClick={() => onToggle(item.id)} className={`flex items-center justify-between gap-4 px-1 py-2.5 transition-colors cursor-pointer group ${item.packed ? 'opacity-60' : 'hover:bg-stone-100/60'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <button type="button" aria-label={item.packed ? `Odznacz: ${item.text}` : `Zaznacz jako spakowane: ${item.text}`} aria-pressed={item.packed} className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-md border transition-colors cursor-pointer ${item.packed ? 'bg-emerald-600 border-emerald-600' : 'border-stone-300 bg-white'}`}>
                      {item.packed && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <span className={`text-sm truncate ${item.packed ? 'line-through text-stone-400' : 'text-zinc-800'}`}>{item.text}</span>
                  </div>
                  <IconButton label="Usuń pozycję" variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"><Trash2 className="w-4 h-4" /></IconButton>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact title="Lista jest pusta." description="Dodaj rzecz powyżej lub wybierz gotowy zestaw." />
          )}
        </section>

        <aside>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Gotowe zestawy</h3>
          <div className="divide-y divide-stone-200 border-y border-stone-200">
            {PACKING_PRESETS.map(preset => {
              const missing = preset.items.filter(t => !existing.has(t.toLowerCase())).length;
              return (
                <div key={preset.label} className="flex items-center justify-between gap-3 px-1 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-zinc-900">{preset.label}</div>
                    <div className="text-xs text-stone-500">{missing === 0 ? 'Wszystko dodane' : `${missing} z ${preset.items.length} pozycji`}</div>
                  </div>
                  <Button variant="secondary" size="sm" disabled={missing === 0} onClick={() => addPreset(preset)}>
                    <Plus className="w-3.5 h-3.5" /> Dodaj
                  </Button>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
