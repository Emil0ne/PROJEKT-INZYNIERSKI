import { motion } from 'framer-motion';
import { MapPinOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <motion.div 
        initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.5 }}
        className="w-16 h-16 bg-stone-100 border border-stone-200 rounded-xl flex items-center justify-center mb-6"
      >
        <MapPinOff className="w-8 h-8 text-stone-600" />
      </motion.div>
      <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 mb-3">404</h1>
      <h2 className="text-xl font-semibold tracking-tight text-zinc-800 mb-4">Zgubiłeś się na szlaku?</h2>
      <p className="text-stone-600 max-w-md mb-8 leading-relaxed">
        Wygląda na to, że ta ścieżka prowadzi donikąd. Strona, której szukasz, nie istnieje lub została przeniesiona. 
      </p>
      <Link to="/" className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-xs flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Wróć do bazy
      </Link>
    </div>
  );
}