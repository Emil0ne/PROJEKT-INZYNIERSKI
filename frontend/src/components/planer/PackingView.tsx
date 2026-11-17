import { useState } from 'react';
import { Plus, ListTodo, Check, Trash2 } from 'lucide-react';
import { Card, IconButton, Input } from '../ui';
import type { PackingItem } from '../../types/trip';

interface PackingViewProps {
  items: PackingItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (text: string) => void;
}

/** Lista rzeczy do spakowania: odhaczanie, usuwanie i dodawanie pozycji. */
export function PackingView({ items, onToggle, onDelete, onAdd }: PackingViewProps) {
  const [newItemText, setNewItemText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    onAdd(newItemText);
    setNewItemText('');
  };

  return (
      <Card padding="lg" className="max-w-3xl mx-auto">
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 flex items-center gap-2.5"><ListTodo className="w-5 h-5 text-stone-500" /> Co spakować?</h2>
        </div>
        <div className="divide-y divide-stone-200 border-y border-stone-200 mb-5">
          {items.map(item => (
            <div key={item.id} onClick={() => onToggle(item.id)} className={`flex items-center justify-between gap-4 px-2 py-3 transition-colors cursor-pointer group ${item.packed ? 'opacity-60' : 'hover:bg-stone-50'}`}>
              <div className="flex items-center gap-3">
                <button type="button" aria-label={item.packed ? `Odznacz: ${item.text}` : `Zaznacz jako spakowane: ${item.text}`} aria-pressed={item.packed} className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-md border transition-colors cursor-pointer ${item.packed ? 'bg-emerald-600 border-emerald-600' : 'border-stone-300 bg-white'}`}>
                  {item.packed && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
                <span className={`text-sm ${item.packed ? 'line-through text-stone-400' : 'text-zinc-800'}`}>{item.text}</span>
              </div>
              <IconButton label="Usuń pozycję" variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"><Trash2 className="w-4 h-4" /></IconButton>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <Input type="text" aria-label="Nowa rzecz do spakowania" icon={<Plus />} value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="Dodaj kolejną rzecz..." />
        </form>
      </Card>
  );
}
