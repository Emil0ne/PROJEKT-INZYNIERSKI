import type { MouseEvent, SyntheticEvent } from 'react';
import { motion } from 'framer-motion';
import { MapPin, MoreHorizontal, Trash2 } from 'lucide-react';
import { Card, IconButton } from '../ui';
import { LAYER } from '../../lib/layers';
import { getDaysUntil } from '../../lib/dates';
import type { TripSummary } from '../../types/trip';

/** Neutralny placeholder (SVG), gdy zdjęcie podróży się nie wczyta – bez ikony zepsutego obrazka. */
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#E7E5E4"/><g fill="none" stroke="#A8A29E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M200 205c-27-32-45-55-45-78a45 45 0 0 1 90 0c0 23-18 46-45 78z"/><circle cx="200" cy="127" r="14"/></g></svg>',
  );

const handleImageError = (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
};

interface TripCardProps {
  trip: TripSummary;
  /** Kolejność na liście – steruje opóźnieniem animacji wejścia. */
  index: number;
  isMenuOpen: boolean;
  onOpen: (tripId: string) => void;
  onToggleMenu: (e: MouseEvent, tripId: string) => void;
  onDelete: (e: MouseEvent, tripId: string) => void;
}

/** Zwarta karta pojedynczej podróży (miniatura, tytuł, lokalizacja, odliczanie, menu opcji). */
export function TripCard({ trip, index, isMenuOpen, onOpen, onToggleMenu, onDelete }: TripCardProps) {
  return (
    <motion.div
      onClick={() => onOpen(trip.id)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
    >
      <Card padding="none" hoverable className="overflow-hidden group cursor-pointer flex">
        <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden bg-stone-100">
          <img
            src={trip.imageUrl}
            alt={trip.title}
            onError={handleImageError}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex-1 min-w-0 p-4 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold tracking-tight text-zinc-900 truncate">{trip.title}</h3>
              <div className="flex items-center gap-1.5 text-stone-600 text-sm mt-0.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-stone-400" /> <span className="truncate">{trip.location}</span>
              </div>
            </div>
            <div className="relative shrink-0">
              <IconButton
                label="Opcje podróży"
                onClick={(e) => onToggleMenu(e, trip.id)}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <MoreHorizontal className="w-4 h-4" />
              </IconButton>

              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-md py-1 ${LAYER.dropdown} border border-stone-200`}
                >
                  <button
                    onClick={(e) => onDelete(e, trip.id)}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Przenieś do kosza
                  </button>
                </motion.div>
              )}
            </div>
          </div>
          <span className="self-start px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
            {getDaysUntil(trip.startDate)}
          </span>
        </div>
      </Card>
    </motion.div>
  );
}
