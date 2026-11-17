import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Loader2, Sparkles, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, cx } from '../ui';
import { LAYER } from '../../lib/layers';
import { DEFAULT_CURRENCY, DEFAULT_TOTAL_BUDGET } from '../../lib/constants';
import { searchCities } from '../../lib/geocoding';
import type { InterestId } from '../../mocks/attractions';
import type { TripPace } from '../../services/assistantApi';
import type { GeocodedPlace } from '../../types/place';

type CreationMode = 'empty' | 'ai';

const PACE_OPTIONS: { id: TripPace; label: string; hint: string }[] = [
  { id: 'relaxed', label: 'Spokojne', hint: '~2 punkty dziennie' },
  { id: 'balanced', label: 'Zrównoważone', hint: '~3 punkty dziennie' },
  { id: 'intensive', label: 'Intensywne', hint: '~5 punktów dziennie' },
];

const COMPANIONS = ['We dwoje', 'Ze znajomymi', 'Solo', 'Rodzinnie'] as const;

/** Etykiety zainteresowań w kreatorze (kolejność wyświetlania). */
const WIZARD_INTERESTS: { id: InterestId; label: string }[] = [
  { id: 'food', label: 'Lokalna kuchnia' },
  { id: 'monuments', label: 'Zabytki i historia' },
  { id: 'nature', label: 'Natura i widoki' },
  { id: 'museums', label: 'Muzea' },
  { id: 'nightlife', label: 'Nocne życie' },
];

const WIZARD_QUESTIONS = [
  'Dokąd i kiedy jedziesz? Wpisz miejsce docelowe i wybierz daty podróży.',
  'Z kim podróżujesz? Dzięki temu dopasuję styl planu.',
  'Jakie tempo zwiedzania Ci odpowiada i ile orientacyjnie chcesz wydać na miejscu?',
  'Na czym zależy Ci najbardziej? Możesz też dopisać specjalne życzenia.',
] as const;

const TOTAL_STEPS = WIZARD_QUESTIONS.length;

const CHIP_BASE = 'px-3 py-1.5 rounded-full border text-sm font-medium transition-colors cursor-pointer';
const CHIP_ON = 'bg-zinc-900 border-zinc-900 text-white';
const CHIP_OFF = 'bg-white border-stone-300 text-zinc-800 hover:border-stone-400';
const TEXT_INPUT = 'w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-zinc-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 focus:border-zinc-900';

function AssistantBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
      </div>
      <div className="bg-stone-100 text-zinc-800 text-sm leading-relaxed rounded-xl rounded-tl-sm px-3.5 py-2.5 max-w-[90%]">{children}</div>
    </div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="bg-zinc-900 text-white text-sm leading-relaxed rounded-xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%]">{children}</div>
    </div>
  );
}

interface PlanTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Modal „Zaplanuj nową podróż”: pusty plan albo 4-krokowy kreator konwersacyjny Asystenta AI. */
export function PlanTripModal({ isOpen, onClose }: PlanTripModalProps) {
  const navigate = useNavigate();

  // Stan dla modala nowej podróży (OpenStreetMap API)
  const [planDestination, setPlanDestination] = useState('');
  const [modalSearchResults, setModalSearchResults] = useState<GeocodedPlace[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedPlace, setSelectedPlace] = useState<GeocodedPlace | null>(null); // miejsce wybrane z listy podpowiedzi
  const modalSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestId = useRef(0); // chroni przed spóźnionymi odpowiedziami

  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  const [planError, setPlanError] = useState('');

  const [mode, setMode] = useState<CreationMode>('empty');

  // Kreator AI
  const [step, setStep] = useState(1);
  const [companionChoice, setCompanionChoice] = useState('');
  const [companionCustom, setCompanionCustom] = useState('');
  const [pace, setPace] = useState<TripPace>('balanced');
  const [budgetInput, setBudgetInput] = useState(String(DEFAULT_TOTAL_BUDGET));
  const [interests, setInterests] = useState<InterestId[]>([]);
  const [notes, setNotes] = useState('');

  const toggleInterest = (id: InterestId) =>
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const dropdownRef = useRef<HTMLDivElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const todayDate = new Date().toISOString().split('T')[0];

  const companion = companionCustom.trim() || companionChoice;
  const budgetValue = Number(budgetInput.replace(',', '.'));

  const resetForm = () => {
    setPlanDestination('');
    setPlanStartDate('');
    setPlanEndDate('');
    setPlanError('');
    setFocusedIndex(-1);
    setMode('empty');
    setStep(1);
    setCompanionChoice('');
    setCompanionCustom('');
    setPace('balanced');
    setBudgetInput(String(DEFAULT_TOTAL_BUDGET));
    setInterests([]);
    setNotes('');
  };

  // Zamyka modal nowej podróży i czyści jego formularz
  const closePlanModal = () => {
    onClose();
    resetForm();
  };

  // Zamknięcie listy podpowiedzi po kliknięciu poza polem celu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDestinations(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Po zamknięciu modala zapominamy wybrane miejsce
  useEffect(() => {
    if (!isOpen) setSelectedPlace(null);
  }, [isOpen]);

  useEffect(() => {
    if (focusedIndex >= 0 && showDestinations) {
      const element = document.getElementById(`place-option-${focusedIndex}`);
      if (element) {
        element.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, showDestinations]);

  // Po przejściu do kolejnego pytania przewijamy wątek rozmowy na dół
  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [step, mode]);

  // Focus trap dla modala "Zaplanuj nową podróż" (lista elementów liczona przy każdym Tabie – zawartość zmienia się między krokami)
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modalElement = modalRef.current;
    const selector = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const initial = modalElement.querySelectorAll<HTMLElement>(selector);
    initial[0]?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = modalElement.querySelectorAll<HTMLElement>(selector);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };

    modalElement.addEventListener('keydown', handleTab);
    return () => modalElement.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  const selectDestination = (place: GeocodedPlace) => {
    setPlanDestination(place.displayName);
    setSelectedPlace(place);
    setShowDestinations(false);
    setFocusedIndex(-1);
  };

  const handleModalDestinationChange = (query: string) => {
    setPlanDestination(query);
    setSelectedPlace(null); // użytkownik zmienił tekst, więc poprzedni wybór przestaje obowiązywać
    setShowDestinations(true);
    setFocusedIndex(-1);

    if (modalSearchTimeout.current) clearTimeout(modalSearchTimeout.current);

    // Szukamy dopiero od 3 znaków
    if (query.trim().length < 3) {
      searchRequestId.current++; // unieważnij trwające zapytania
      setModalSearchResults([]);
      setIsModalSearching(false);
      return;
    }

    setIsModalSearching(true);
    const requestId = ++searchRequestId.current;

    modalSearchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchCities(query, { limit: 6, destinationMode: true });

        // Jeśli w międzyczasie wpisano coś nowego, ignorujemy tę odpowiedź
        if (requestId !== searchRequestId.current) return;

        setModalSearchResults(results);
      } catch {
        if (requestId === searchRequestId.current) setModalSearchResults([]);
      } finally {
        if (requestId === searchRequestId.current) setIsModalSearching(false);
      }
    }, 300);
  };

  /** Waliduje cel i daty; zwraca wybrane miejsce albo null (ustawiając komunikat błędu). */
  const validateDestinationAndDates = (): GeocodedPlace | null => {
    setPlanError('');
    if (!planDestination.trim()) {
      setPlanError('Proszę określić cel podróży.');
      return null;
    }

    const place =
      selectedPlace ||
      (!isModalSearching && modalSearchResults.length > 0 ? modalSearchResults[0] : null);
    if (!place) {
      setPlanError('Wybierz miejsce z listy podpowiedzi.');
      return null;
    }
    if (!planStartDate || !planEndDate) {
      setPlanError('Proszę wybrać datę rozpoczęcia i zakończenia podróży.');
      return null;
    }

    if (planStartDate < todayDate) {
      setPlanError('Data rozpoczęcia nie może być datą z przeszłości.');
      return null;
    }

    if (planEndDate < planStartDate) {
      setPlanError('Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.');
      return null;
    }
    return place;
  };

  const navigateToPlaner = (place: GeocodedPlace) => {
    const params = new URLSearchParams();
    params.set('dest', place.displayName);
    params.set('lat', String(place.lat));
    params.set('lng', String(place.lng));
    params.set('kind', place.kind);
    params.set('start', planStartDate || todayDate);
    params.set('end', planEndDate || todayDate);
    if (mode === 'ai') {
      params.set('ai', '1');
      params.set('pace', pace);
      params.set('budget', String(Math.round(budgetValue)));
      if (companion) params.set('companion', companion);
      if (interests.length > 0) params.set('interests', interests.join(','));
      if (notes.trim()) params.set('notes', notes.trim());
    }

    onClose();
    resetForm();
    navigate(`/planer/nowy?${params.toString()}`);
  };

  const handleStartPlanning = () => {
    const place = validateDestinationAndDates();
    if (place) navigateToPlaner(place);
  };

  const handleNext = () => {
    if (step === 1) {
      const place = validateDestinationAndDates();
      if (!place) return;
      selectDestination(place);
      setStep(2);
      return;
    }
    if (step === 3 && !(Number.isFinite(budgetValue) && budgetValue > 0)) {
      setPlanError('Podaj budżet jako liczbę większą od zera.');
      return;
    }
    setPlanError('');
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    // Krok 4 zatwierdzony – wszystkie dane są już zwalidowane w krokach 1 i 3
    const place = selectedPlace ?? validateDestinationAndDates();
    if (place) navigateToPlaner(place);
  };

  const handleBack = () => {
    setPlanError('');
    setStep((s) => Math.max(1, s - 1));
  };

  const answerSummary = (s: number): string => {
    switch (s) {
      case 1: return `${planDestination}, ${planStartDate} – ${planEndDate}`;
      case 2: return companion || 'Bez szczególnych preferencji';
      case 3: return `${PACE_OPTIONS.find((p) => p.id === pace)?.label ?? ''} tempo, budżet ok. ${Math.round(budgetValue)} ${DEFAULT_CURRENCY}`;
      default: {
        const labels = WIZARD_INTERESTS.filter((i) => interests.includes(i.id)).map((i) => i.label);
        return [labels.join(', '), notes.trim()].filter(Boolean).join(' · ') || 'Bez szczególnych preferencji';
      }
    }
  };

  const onEnter = (action: () => void) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const destinationField = (
    <div className="relative" ref={dropdownRef}>
      <div className="border border-stone-300 rounded-lg focus-within:ring-4 focus-within:ring-zinc-900/10 focus-within:border-zinc-900 hover:border-stone-400 transition-colors bg-white flex items-center relative z-20">
        <div className="pl-4 text-xs font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap flex items-center gap-2">
          {isModalSearching ? <Loader2 className="w-4 h-4 text-stone-500 animate-spin" /> : null}
          Dokąd?
        </div>
        <input
          type="text"
          value={planDestination}
          onChange={(e) => handleModalDestinationChange(e.target.value)}
          onFocus={() => setShowDestinations(true)}
          onKeyDown={(e) => {
            if (!showDestinations || modalSearchResults.length === 0) return;

            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setFocusedIndex(prev => (prev < modalSearchResults.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (focusedIndex >= 0 && focusedIndex < modalSearchResults.length) {
                selectDestination(modalSearchResults[focusedIndex]);
              } else if (modalSearchResults.length > 0) {
                selectDestination(modalSearchResults[0]);
              }
            } else if (e.key === 'Escape') {
              setShowDestinations(false);
            }
          }}
          aria-label="Cel podróży"
          placeholder="Wpisz min. 3 znaki (np. Warszawa, Tokio)..."
          className="w-full py-3 pl-3 pr-4 bg-transparent text-sm text-zinc-900 focus:outline-none placeholder:text-stone-400"
        />
      </div>

      <AnimatePresence>
        {showDestinations && planDestination.trim().length >= 3 && modalSearchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            role="listbox"
            className={`absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-lg shadow-md ${LAYER.dropdown} overflow-hidden max-h-64 overflow-y-auto`}
          >
            {modalSearchResults.map((place, index) => (
              <div
                id={`place-option-${index}`}
                key={place.id}
                role="option"
                aria-selected={focusedIndex === index}
                onClick={() => selectDestination(place)}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-stone-100 last:border-0 transition-colors ${
                  focusedIndex === index ? 'bg-stone-100' : 'hover:bg-stone-50'
                }`}
              >
                <div className="pr-4">
                  <div className="font-medium text-zinc-900 text-sm">{place.name}</div>
                  <div className="text-xs text-stone-500 mt-0.5 line-clamp-1">{place.displayName}</div>
                </div>
                <span className="bg-stone-100 text-stone-600 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                  {place.kind === 'country' ? 'Kraj' : place.kind === 'region' ? 'Region' : 'Miasto'}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {showDestinations &&
          planDestination.trim().length >= 3 &&
          !isModalSearching &&
          modalSearchResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-lg shadow-md ${LAYER.dropdown} px-4 py-3 text-sm text-stone-500`}
          >
            Nie znaleziono pasujących miast ani państw.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const datesField = (
    <div className="flex flex-col sm:flex-row border border-stone-300 rounded-lg overflow-hidden bg-white">
      <div
        className="relative flex-1 p-2 sm:border-r border-stone-300 focus-within:bg-stone-50 transition-colors group cursor-pointer"
        onClick={() => {
          try {
            startDateRef.current?.showPicker();
          } catch {
            // ignore
          }
        }}
      >
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider pl-3 pt-2 flex items-center gap-1.5 pointer-events-none">
            <Calendar className="w-3.5 h-3.5" />
            Data rozpoczęcia
          </span>
          <input
            ref={startDateRef}
            type="date"
            min={todayDate}
            value={planStartDate}
            onChange={(e) => setPlanStartDate(e.target.value)}
            aria-label="Data rozpoczęcia"
            className="w-full bg-transparent px-3 py-1.5 text-sm text-zinc-900 font-medium focus:outline-none cursor-pointer"
            onClick={(e) => {
              try { e.currentTarget.showPicker(); } catch { /* ignore */ }
            }}
          />
        </div>
      </div>

      <div
        className="relative flex-1 p-2 border-t sm:border-t-0 border-stone-300 focus-within:bg-stone-50 transition-colors group cursor-pointer"
        onClick={() => {
          try {
            endDateRef.current?.showPicker();
          } catch {
            // ignore
          }
        }}
      >
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider pl-3 pt-2 flex items-center gap-1.5 pointer-events-none">
            <Calendar className="w-3.5 h-3.5" />
            Data zakończenia
          </span>
          <input
            ref={endDateRef}
            type="date"
            min={planStartDate || todayDate}
            value={planEndDate}
            onChange={(e) => setPlanEndDate(e.target.value)}
            aria-label="Data zakończenia"
            className="w-full bg-transparent px-3 py-1.5 text-sm text-zinc-900 font-medium focus:outline-none cursor-pointer"
            onClick={(e) => {
              try { e.currentTarget.showPicker(); } catch { /* ignore */ }
            }}
          />
        </div>
      </div>
    </div>
  );

  /** Kontrolki odpowiedzi dla aktywnego kroku kreatora. */
  const stepControls = (() => {
    switch (step) {
      case 1:
        return <div className="space-y-3 pl-9">{destinationField}{datesField}</div>;
      case 2:
        return (
          <div className="space-y-3 pl-9">
            <div role="radiogroup" aria-label="Towarzystwo" className="flex flex-wrap gap-2">
              {COMPANIONS.map((label) => {
                const selected = companionChoice === label && !companionCustom.trim();
                return (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => { setCompanionChoice(label); setCompanionCustom(''); }}
                    className={cx(CHIP_BASE, selected ? CHIP_ON : CHIP_OFF)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={companionCustom}
              onChange={(e) => setCompanionCustom(e.target.value)}
              onKeyDown={onEnter(handleNext)}
              maxLength={80}
              aria-label="Własny opis towarzystwa"
              placeholder="Albo opisz po swojemu, np. z dwójką dzieci"
              className={TEXT_INPUT}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-3 pl-9">
            <div role="radiogroup" aria-label="Tempo zwiedzania" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PACE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={pace === opt.id}
                  onClick={() => setPace(opt.id)}
                  className={cx(
                    'text-left rounded-lg border px-3 py-2 transition-colors cursor-pointer',
                    pace === opt.id ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-stone-300 text-zinc-800 hover:border-stone-400',
                  )}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className={cx('text-xs', pace === opt.id ? 'text-stone-300' : 'text-stone-500')}>{opt.hint}</div>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap">Budżet ({DEFAULT_CURRENCY})</span>
              <input
                type="number"
                inputMode="decimal"
                min={1}
                step={50}
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onKeyDown={onEnter(handleNext)}
                aria-label={`Budżet na miejscu w ${DEFAULT_CURRENCY}`}
                className={cx(TEXT_INPUT, 'max-w-[10rem] tabular-nums')}
              />
            </label>
          </div>
        );
      default:
        return (
          <div className="space-y-3 pl-9">
            <div role="group" aria-label="Zainteresowania" className="flex flex-wrap gap-2">
              {WIZARD_INTERESTS.map(({ id, label }) => {
                const selected = interests.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleInterest(id)}
                    className={cx(CHIP_BASE, selected ? 'bg-emerald-600 border-emerald-600 text-white' : CHIP_OFF)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={300}
              rows={2}
              aria-label="Specjalne życzenia"
              placeholder="Specjalne życzenia, np. bez porannego pośpiechu, mniej chodzenia"
              className={cx(TEXT_INPUT, 'resize-none')}
            />
          </div>
        );
    }
  })();

  const aiWizard = (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap tabular-nums">
          Krok {step} z {TOTAL_STEPS}
        </span>
        <div className="flex flex-1 gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step} aria-label="Postęp kreatora">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span key={i} className={cx('h-1 flex-1 rounded-full transition-colors', i < step ? 'bg-emerald-600' : 'bg-stone-200')} />
          ))}
        </div>
      </div>

      {/* Dropdown podpowiedzi w kroku 1 nie może być przycięty, więc przewijanie włączamy dopiero od kroku 2 */}
      <div ref={threadRef} className={cx('space-y-3', step > 1 && 'max-h-[46vh] overflow-y-auto pr-1')}>
        {WIZARD_QUESTIONS.slice(0, step).map((question, i) => {
          const s = i + 1;
          return (
            <div key={s} className="space-y-3">
              <AssistantBubble>{question}</AssistantBubble>
              {s < step ? <UserBubble>{answerSummary(s)}</UserBubble> : stepControls}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
      <AnimatePresence>
        {isOpen && (
          <div className={`fixed inset-0 ${LAYER.modal} flex items-center justify-center px-4`}>
            <div
              className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm cursor-pointer"
              onClick={closePlanModal}
            ></div>

            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label="Zaplanuj nową podróż"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-xl p-6 md:p-8 z-10 overflow-visible"
            >
              <IconButton
                label="Zamknij"
                round
                onClick={closePlanModal}
                className="absolute top-4 right-4 z-20"
              >
                <X className="w-5 h-5" />
              </IconButton>

              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mb-6">
                Zaplanuj nową podróż
              </h2>

              <div className="space-y-5 relative">
                <div role="radiogroup" aria-label="Tryb tworzenia podróży" className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-lg">
                  {([
                    { id: 'empty', label: 'Pusty plan', icon: <FileText className="w-4 h-4" /> },
                    { id: 'ai', label: 'Wygeneruj plan z AI', icon: <Sparkles className="w-4 h-4" /> },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={mode === opt.id}
                      onClick={() => { setMode(opt.id); setPlanError(''); }}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        mode === opt.id
                          ? 'bg-white text-zinc-900 shadow-xs border border-stone-200'
                          : 'text-stone-600 hover:text-zinc-900 border border-transparent'
                      }`}
                    >
                      <span className={mode === opt.id && opt.id === 'ai' ? 'text-emerald-600' : ''}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>

                {mode === 'ai' ? (
                  aiWizard
                ) : (
                  <>
                    {destinationField}
                    {datesField}
                  </>
                )}

                {planError && (
                  <div role="alert" className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                    {planError}
                  </div>
                )}

                <div className="pt-4 flex items-center justify-between gap-2">
                  <div>
                    {mode === 'ai' && step > 1 && (
                      <Button variant="ghost" onClick={handleBack}>
                        <ArrowLeft className="w-4 h-4" /> Wstecz
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    {mode === 'ai' ? (
                      <Button onClick={handleNext}>
                        {step < TOTAL_STEPS ? 'Dalej' : <><Sparkles className="w-4 h-4" /> Ułóż mój plan</>}
                      </Button>
                    ) : (
                      <Button onClick={handleStartPlanning}>Zacznij planować</Button>
                    )}
                    <Button variant="secondary" onClick={closePlanModal}>
                      Anuluj
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
  );
}
