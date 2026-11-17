import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Check, Loader2, MapPin, Plus, Route, Send, Sparkles, X } from 'lucide-react';
import { Button, IconButton, cx } from '../ui';
import { LAYER } from '../../lib/layers';
import { formatKm, routeLengthKm } from '../../lib/geo';
import { askTripAssistant } from '../../services/assistantApi';
import { useAiMode, type AiMode } from '../../services/apiClient';
import type { ScheduleItem, Trip, TripDay } from '../../types/trip';

const AI_MODE_BADGE: Record<AiMode, { label: string; hint: string; className: string }> = {
  demo: { label: 'Tryb demo', hint: 'Backend wyłączony – odpowiedzi z lokalnego mocka.', className: 'bg-stone-100 text-stone-600 border-stone-200' },
  pending: { label: 'AI: backend', hint: 'Backend włączony – czeka na pierwsze zapytanie.', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  backend: { label: 'AI: backend ✓', hint: 'Ostatnia odpowiedź pochodzi z backendu.', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  fallback: { label: 'Backend niedostępny – demo', hint: 'Backend nie odpowiedział, użyto lokalnego mocka.', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const QUICK_ACTIONS = [
  'Zoptymalizuj trasę tego dnia',
  'Zaproponuj pobliskie miejsca',
  'Oceń tempo i budżet',
] as const;

interface ReorderPreview {
  items: ScheduleItem[];
  beforeKm: number;
  afterKm: number;
}

interface AssistantMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  /** Dzień, którego dotyczyło pytanie – zmiany trafiają właśnie tam. */
  dayId?: string;
  reorder?: ReorderPreview;
  suggestions?: ScheduleItem[];
  applied?: boolean;
}

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  activeDay: TripDay | undefined;
  onApplyReorder: (dayId: string, items: ScheduleItem[]) => void;
  onAddItems: (dayId: string, items: ScheduleItem[]) => void;
}

const dayLabel = (day: TripDay) => day.customTitle || `Dzień ${day.dayNumber}`;

/** Czy kolejność z podglądu nadal dotyczy tych samych punktów, które są teraz w dniu. */
const matchesCurrentItems = (preview: ReorderPreview, day: TripDay | undefined): boolean => {
  if (!day || day.items.length !== preview.items.length) return false;
  const ids = new Set(day.items.map((i) => i.id));
  return preview.items.every((i) => ids.has(i.id));
};

/** Boczny panel Asystenta Logistyki: czat + karty podglądu zmian w aktywnym dniu. */
export function AssistantDrawer({ isOpen, onClose, trip, activeDay, onApplyReorder, onAddItems }: AssistantDrawerProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 0,
      role: 'assistant',
      text: 'Cześć! Jestem Asystentem Logistyki. Pomogę uporządkować trasę wybranego dnia albo znaleźć miejsca w okolicy.',
    },
  ]);
  const aiMode = useAiMode();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);

  // Przewijamy wyłącznie listę wiadomości. scrollIntoView przewijałby też przodków
  // z overflow-hidden (cały układ Planera) i wypychał sidebar poza ekran.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, isLoading]);

  const canAsk = !!activeDay && !isLoading;

  const send = async (rawPrompt: string) => {
    const prompt = rawPrompt.trim();
    if (!prompt || !activeDay || isLoading) return;
    const day = activeDay;
    setInput('');
    setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', text: prompt }]);
    setIsLoading(true);
    try {
      const result = await askTripAssistant({ trip, activeDayId: day.id, prompt });
      const reorder: ReorderPreview | undefined = result.reorderedDayItems
        ? {
            items: result.reorderedDayItems,
            beforeKm: routeLengthKm(day.items),
            afterKm: routeLengthKm(result.reorderedDayItems),
          }
        : undefined;
      const suggestions = result.suggestedItems && result.suggestedItems.length > 0 ? result.suggestedItems : undefined;
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, role: 'assistant', text: result.message, dayId: day.id, reorder, suggestions },
      ]);
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : 'Nieznany błąd.';
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, role: 'assistant', text: `Nie udało się uzyskać odpowiedzi. ${reason}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const markApplied = (messageId: number) =>
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, applied: true } : m)));

  const applyReorder = (message: AssistantMessage) => {
    if (!message.dayId || !message.reorder) return;
    onApplyReorder(message.dayId, message.reorder.items);
    markApplied(message.id);
  };

  const addSuggestions = (message: AssistantMessage) => {
    if (!message.dayId || !message.suggestions) return;
    onAddItems(message.dayId, message.suggestions);
    markApplied(message.id);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <aside
      aria-label="Asystent AI"
      aria-hidden={!isOpen}
      className={cx(
        'absolute right-0 top-0 bottom-0 w-full max-w-[400px] flex flex-col bg-[#FAF9F6] border-l border-stone-200 shadow-lg',
        'transition-transform duration-300 ease-out',
        LAYER.floating,
        isOpen ? 'translate-x-0' : 'translate-x-full invisible',
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 h-14 border-b border-stone-200 bg-white shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 leading-tight">Asystent Logistyki</h2>
            <p className="text-xs text-stone-500 truncate">
              {activeDay ? `Aktywny dzień: ${dayLabel(activeDay)}` : 'Wybierz dzień w panelu bocznym'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            title={AI_MODE_BADGE[aiMode].hint}
            className={cx('px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap', AI_MODE_BADGE[aiMode].className)}
          >
            {AI_MODE_BADGE[aiMode].label}
          </span>
          <IconButton label="Zamknij Asystenta" onClick={onClose}><X className="w-4 h-4" /></IconButton>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
        {messages.map((m) => {
          const isStale = !!m.reorder && !matchesCurrentItems(m.reorder, activeDay?.id === m.dayId ? activeDay : undefined);
          return (
            <div key={m.id} className={cx('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}>
              <div
                className={cx(
                  'max-w-[90%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-zinc-900 text-white rounded-br-sm'
                    : 'bg-white border border-stone-200 text-zinc-800 rounded-bl-sm',
                )}
              >
                {m.text}
              </div>

              {m.reorder && (
                <div className="w-full bg-white border border-stone-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    <Route className="w-3.5 h-3.5" /> Nowa kolejność
                  </div>
                  <div className="flex items-center gap-2 text-sm tabular-nums">
                    <span className="text-stone-500 line-through">{formatKm(m.reorder.beforeKm)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-semibold text-zinc-900">{formatKm(m.reorder.afterKm)}</span>
                    <span className="ml-auto text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      −{formatKm(Math.max(0, m.reorder.beforeKm - m.reorder.afterKm))}
                    </span>
                  </div>
                  <ol className="space-y-1">
                    {m.reorder.items.map((item, i) => (
                      <li key={item.id} className="flex items-baseline gap-2 text-sm">
                        <span className="w-5 text-xs text-stone-400 tabular-nums">{i + 1}.</span>
                        <span className="flex-1 min-w-0 truncate text-zinc-800">{item.title}</span>
                        <span className="text-xs text-stone-500 tabular-nums">{item.time}</span>
                      </li>
                    ))}
                  </ol>
                  <Button
                    size="sm"
                    fullWidth
                    disabled={m.applied || isStale}
                    onClick={() => applyReorder(m)}
                  >
                    {m.applied ? <><Check className="w-4 h-4" /> Zastosowano</> : isStale ? 'Plan dnia zmienił się' : 'Zastosuj kolejność'}
                  </Button>
                </div>
              )}

              {m.suggestions && (
                <div className="w-full bg-white border border-stone-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    <MapPin className="w-3.5 h-3.5" /> Proponowane miejsca
                  </div>
                  <ul className="space-y-1.5">
                    {m.suggestions.map((item) => (
                      <li key={item.id} className="flex items-baseline gap-2 text-sm">
                        <span className="flex-1 min-w-0 truncate text-zinc-800">{item.title}</span>
                        <span className="text-xs text-stone-500 tabular-nums">{item.time}</span>
                        {item.cost > 0 && (
                          <span className="text-xs text-stone-500 tabular-nums">{item.cost} {trip.currency}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" fullWidth disabled={m.applied} onClick={() => addSuggestions(m)}>
                    {m.applied ? <><Check className="w-4 h-4" /> Dodano do planu</> : <><Plus className="w-4 h-4" /> Dodaj do planu</>}
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Asystent analizuje plan…
          </div>
        )}
      </div>

      <div className="border-t border-stone-200 bg-white p-3 space-y-2.5 shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              disabled={!canAsk}
              onClick={() => void send(action)}
              className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-full hover:bg-stone-50 hover:border-stone-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {action}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Wiadomość do Asystenta"
            placeholder="Zapytaj o trasę, miejsca, tempo…"
            className="flex-1 min-w-0 px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-zinc-900/10 focus:border-zinc-900"
          />
          <Button type="submit" aria-label="Wyślij" disabled={!canAsk || input.trim() === ''} className="!p-2.5">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
