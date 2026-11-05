import { motion } from 'framer-motion';
import { MapPinOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <motion.div 
        initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.5 }}
        className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8 shadow-sm"
      >
        <MapPinOff className="w-12 h-12 text-emerald-600" />
      </motion.div>
      <h1 className="text-6xl font-black text-slate-900 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-slate-700 mb-6">Zgubiłeś się na szlaku?</h2>
      <p className="text-slate-500 max-w-md mb-10 leading-relaxed">
        Wygląda na to, że ta ścieżka prowadzi donikąd. Strona, której szukasz, nie istnieje lub została przeniesiona. 
      </p>
      <Link to="/" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-lg shadow-emerald-200 hover:-translate-y-0.5 flex items-center gap-2">
        <ArrowLeft className="w-5 h-5" /> Wróć do bazy
      </Link>
    </div>
  );
}